import { Hono } from "hono";
import { registerAppMiddleware } from "./app/http-middleware";
import { isCloudflareWorkerRuntime, setAppRuntime } from "./lib/runtime";
import {
  apiRateLimitMiddleware,
  authBruteForceMiddleware,
  authRateLimitMiddleware,
} from "./middlewares/security";
import { authRoutes } from "./modules/auth/auth.route";
import { v1Routes } from "./routes/v1-routes";

export type AppTarget = "bun" | "cloudflare-worker";

export const applyAuthProtection = (app: Hono) => {
  const isEnabled = (value: string | undefined, fallback: boolean) => {
    if (value == null) return fallback;
    const normalized = value.trim().toLowerCase();
    return !["0", "false", "no", "off"].includes(normalized);
  };

  const enabled =
    isEnabled(process.env.AUTH_SECURITY_MIDDLEWARE_ENABLED, true);
  const bruteForceEnabled = isEnabled(
    process.env.AUTH_BRUTE_FORCE_MIDDLEWARE_ENABLED,
    !isCloudflareWorkerRuntime(),
  );

  if (!enabled) {
    return;
  }

  app.use("/auth/*", authRateLimitMiddleware);
  if (bruteForceEnabled) {
    app.use("/auth/sign-in/email", authBruteForceMiddleware);
  }
};

export const createApp = (target: AppTarget = "bun") => {
  setAppRuntime(target);
  const app = new Hono().basePath("/api");
  registerAppMiddleware(app);
  // Deliberately does not reach the database: this is a liveness check for
  // Cloudflare, uptime monitoring, and safe post-deploy verification.
  app.get("/health", (c) =>
    c.json({
      status: "ok",
      service: "mm-exam-studio-api",
    }),
  );
  applyAuthProtection(app);
  app.use("/v1/*", apiRateLimitMiddleware);
  app.route("/auth", authRoutes);
  app.route("/v1", v1Routes(target));
  return app;
};
