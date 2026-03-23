import {
  getRequestOrigin,
  resolveExactOrigins,
  toOriginSet,
} from "@/lib/origin-policy";
import type { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

const allowedOrigins = toOriginSet(
  resolveExactOrigins({
    raw: process.env.CORS_ALLOWED_ORIGINS,
    includeDevelopmentDefaults: process.env.NODE_ENV === "development",
  }),
);

const allowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const allowedHeaders = (
  process.env.CORS_ALLOWED_HEADERS ??
  "Content-Type,Authorization,X-Requested-With"
)
  .split(",")
  .map((header) => header.trim())
  .filter(Boolean);
const allowedHeadersSet = new Set(
  allowedHeaders.map((header) => header.toLowerCase()),
);

const securityHeadersEnabled =
  (process.env.SECURITY_HEADERS_ENABLED ?? "true").trim().toLowerCase() !==
  "false";
const defaultCspPolicy =
  "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; object-src 'none'; img-src 'self' data:; media-src 'self' https:; connect-src 'self'; script-src 'none'; style-src 'none'";
const cspPolicy = (process.env.CSP_POLICY ?? defaultCspPolicy).trim();
const slowRequestThresholdMs = (() => {
  const parsed = Number.parseInt(
    (process.env.HTTP_SLOW_REQUEST_MS ?? "1200").trim(),
    10,
  );
  if (!Number.isFinite(parsed) || parsed < 0) return 1200;
  return parsed;
})();

const resolveAllowedOrigin = (request: Request) => {
  const origin = getRequestOrigin(request);
  if (!origin) return null;
  return allowedOrigins.has(origin) ? origin : null;
};

const buildCorsHeaders = (origin: string) =>
  ({
    vary: "Origin",
    "access-control-allow-origin": origin,
    "access-control-allow-credentials": "true",
    "access-control-allow-methods": allowedMethods.join(","),
    "access-control-allow-headers": allowedHeaders.join(","),
    "access-control-expose-headers": "x-request-id",
    "access-control-max-age": "600",
  }) as const;

const newRequestId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

const registerRequestIdMiddleware = (app: Hono) => {
  app.use("*", async (c, next) => {
    const requestId = newRequestId();
    const startedAt = Date.now();

    await next();

    c.res.headers.set("x-request-id", requestId);

    const durationMs = Date.now() - startedAt;
    if (durationMs >= slowRequestThresholdMs) {
      console.warn(
        `[http] slow request ${c.req.method} ${c.req.path} ${durationMs}ms requestId=${requestId}`,
      );
    }
  });
};

const registerCorsMiddleware = (app: Hono) => {
  app.use("*", async (c, next) => {
    const request = c.req.raw;
    const origin = request.headers.get("origin");
    const allowedOrigin = resolveAllowedOrigin(request);
    if (!allowedOrigin) {
      if (origin && request.method === "OPTIONS") {
        return c.text("CORS origin is not allowed", 403);
      }
      await next();
      return;
    }

    const requestedMethod = request.headers.get(
      "access-control-request-method",
    );
    if (
      requestedMethod &&
      !allowedMethods.includes(requestedMethod.toUpperCase())
    ) {
      return c.text("CORS method is not allowed", 403);
    }

    const requestedHeaders = request.headers.get(
      "access-control-request-headers",
    );
    if (requestedHeaders) {
      const requestHeaders = requestedHeaders
        .split(",")
        .map((header) => header.trim().toLowerCase())
        .filter(Boolean);
      const hasDisallowedHeader = requestHeaders.some(
        (header) => !allowedHeadersSet.has(header),
      );
      if (hasDisallowedHeader) {
        return c.text("CORS headers are not allowed", 403);
      }
    }

    const corsHeaders = buildCorsHeaders(allowedOrigin);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    await next();
    for (const [key, value] of Object.entries(corsHeaders)) {
      c.res.headers.set(key, value);
    }
  });
};

const registerSecurityHeadersMiddleware = (app: Hono) => {
  app.use("*", async (c, next) => {
    await next();
    if (!securityHeadersEnabled) return;

    const isMediaFileRoute = c.req.path.startsWith("/api/v1/media/files/");

    if (isMediaFileRoute) {
      c.res.headers.set("x-content-type-options", "nosniff");
      c.res.headers.set("referrer-policy", "no-referrer");
      c.res.headers.set("cross-origin-resource-policy", "cross-origin");
      c.res.headers.delete("x-frame-options");
      c.res.headers.delete("content-security-policy");
      c.res.headers.delete("cross-origin-opener-policy");
      return;
    }

    c.res.headers.set("x-content-type-options", "nosniff");
    c.res.headers.set("x-frame-options", "DENY");
    c.res.headers.set("referrer-policy", "no-referrer");
    c.res.headers.set(
      "permissions-policy",
      "geolocation=(), microphone=(), camera=(), payment=(), usb=(), browsing-topics=()",
    );
    c.res.headers.set("cross-origin-opener-policy", "same-origin");
    c.res.headers.set("cross-origin-resource-policy", "same-origin");
    if (cspPolicy) {
      c.res.headers.set("content-security-policy", cspPolicy);
    }
  });
};

const registerErrorHandler = (app: Hono) => {
  app.onError((error, c) => {
    console.error(`[http] ${c.req.method} ${c.req.path}`, error);

    const requestId = c.res.headers.get("x-request-id");
    const isDevelopment =
      (process.env.NODE_ENV ?? "development") !== "production";
    const status =
      error instanceof HTTPException
        ? (error.status as
            | 400
            | 401
            | 403
            | 404
            | 409
            | 410
            | 413
            | 415
            | 416
            | 422
            | 429
            | 500
            | 502
            | 503
            | 504)
        : (500 as const);

    const message =
      error instanceof HTTPException
        ? error.message || "Request failed"
        : isDevelopment &&
            error instanceof Error &&
            error.message.trim().length > 0
          ? error.message
          : "Internal Server Error";

    const payload: { message: string; requestId?: string } = { message };
    if (requestId) {
      payload.requestId = requestId;
    }

    return c.json(payload, status);
  });
};

export const registerAppMiddleware = (app: Hono) => {
  registerRequestIdMiddleware(app);
  registerCorsMiddleware(app);
  registerSecurityHeadersMiddleware(app);
  registerErrorHandler(app);
};
