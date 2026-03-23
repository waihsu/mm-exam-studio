import type { MiddlewareHandler } from "hono";
import type { AppBindings } from "@/core/types/app";
import { securityStore } from "@/lib/security-store";

type RateLimitWindow = {
  windowMs: number;
  max: number;
};

type EndpointRateLimitOptions = {
  namespace: string;
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

const getOptionalUserId = (c: {
  get: (name: "user") => AppBindings["Variables"]["user"] | undefined;
}) => {
  try {
    const user = c.get("user");
    return user && typeof user.id === "string" && user.id.trim().length > 0
      ? user.id
      : "anonymous";
  } catch {
    return "anonymous";
  }
};

export const createEndpointRateLimitMiddleware = (
  options: EndpointRateLimitOptions,
): MiddlewareHandler<AppBindings> => {
  return async (c, next) => {
    if (c.req.method === "OPTIONS") {
      await next();
      return;
    }

    const now = Date.now();
    const ip = getClientIp(c.req.raw);
    const userId = getOptionalUserId(c);

    for (const window of options.windows) {
      const counter = await securityStore.incrementRateLimit(
        `${options.namespace}:${options.keyId}:${ip}:${userId}:${window.windowMs}`,
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
