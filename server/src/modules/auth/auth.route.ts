import { Hono } from "hono";
import { parseJsonBodyWithSchema } from "@/lib/route-utils";
import { auth } from "@/lib/auth";
import { AuthService } from "./auth.service";
import { changePasswordSchema } from "./auth.schema";
import { createAuthEmailRateLimitMiddleware } from "./rate-limit";

const handler = (fn: (req: Request) => Promise<Response>) => (c: any) => fn(c.req.raw);

export const authRoutes = new Hono();

const readPositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
};

authRoutes.use(
  "/request-password-reset",
  createAuthEmailRateLimitMiddleware({
    keyId: "request-password-reset",
    windows: [
      {
        windowMs: 900_000,
        max: readPositiveInt(process.env.AUTH_REQUEST_PASSWORD_RESET_PER_15_MIN, 3),
      },
      {
        windowMs: 86_400_000,
        max: readPositiveInt(process.env.AUTH_REQUEST_PASSWORD_RESET_PER_DAY, 10),
      },
    ],
    message: "Too many password reset requests. Please wait before requesting another email.",
  }),
);

authRoutes.use(
  "/send-verification-email",
  createAuthEmailRateLimitMiddleware({
    keyId: "send-verification-email",
    windows: [
      {
        windowMs: 900_000,
        max: readPositiveInt(process.env.AUTH_SEND_VERIFICATION_PER_15_MIN, 3),
      },
      {
        windowMs: 86_400_000,
        max: readPositiveInt(process.env.AUTH_SEND_VERIFICATION_PER_DAY, 10),
      },
    ],
    message: "Too many verification email requests. Please wait before sending another email.",
  }),
);

authRoutes.post(
  "/sign-in/email",
  handler((req) => AuthService.signInEmail(req)),
);

authRoutes.get(
  "/sessions",
  handler(async (req) => Response.json(await AuthService.listOwnSessions(req))),
);

authRoutes.post(
  "/sessions/revoke-others",
  handler(async (req) => Response.json(await AuthService.revokeOtherSessions(req))),
);

authRoutes.post(
  "/sessions/revoke",
  handler(async (req) => Response.json(await AuthService.revokeSession(req))),
);

authRoutes.post("/password/change", async (c) => {
  const payload = await parseJsonBodyWithSchema(c.req.raw, changePasswordSchema);
  return c.json(await AuthService.changePassword(c.req.raw, payload));
});

authRoutes.on(["POST", "GET"], "*", (c) => auth.handler(c.req.raw));
