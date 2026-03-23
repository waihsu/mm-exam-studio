import type { MiddlewareHandler } from "hono";
import type { AppBindings } from "@/core/types/app";
import { securityStore } from "@/lib/security-store";
import { normalizeEmail } from "./auth.utils";

type RateLimitWindow = {
  windowMs: number;
  max: number;
};

type AuthEmailRateLimitOptions = {
  keyId: string;
  windows: readonly RateLimitWindow[];
  message: string;
};

const getClientIp = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
};

const readBodyEmail = async (request: Request) => {
  try {
    const body = (await request.clone().json()) as { email?: unknown };
    return typeof body.email === "string" ? normalizeEmail(body.email) : "";
  } catch {
    return "";
  }
};

const readSignedInUserEmail = (c: {
  get: (name: "user") => AppBindings["Variables"]["user"] | undefined;
}) => {
  try {
    const user = c.get("user");
    return normalizeEmail(typeof user?.email === "string" ? user.email : "");
  } catch {
    return "";
  }
};

export const createAuthEmailRateLimitMiddleware = (
  options: AuthEmailRateLimitOptions,
): MiddlewareHandler<AppBindings> => {
  return async (c, next) => {
    if (c.req.method === "OPTIONS") {
      await next();
      return;
    }

    const now = Date.now();
    const ip = getClientIp(c.req.raw);
    const email =
      (await readBodyEmail(c.req.raw)) || readSignedInUserEmail(c) || "unknown";

    for (const window of options.windows) {
      const counter = await securityStore.incrementRateLimit(
        `auth-email:${options.keyId}:${ip}:${email}:${window.windowMs}`,
        window.windowMs,
        now,
      );

      if (counter.count > window.max) {
        c.res.headers.set(
          "retry-after",
          String(Math.ceil((counter.resetAt - now) / 1000)),
        );
        c.res.headers.set("x-rate-limit-scope", options.keyId);
        return c.json({ message: options.message }, 429);
      }
    }

    await next();
  };
};
