import type { MiddlewareHandler } from "hono";
import type { AppBindings } from "../core/types/app";
import { securityStore } from "../lib/security-store";

const rateLimitWindowMs = Number(
  process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 60_000,
);
const rateLimitMax = Number(process.env.AUTH_RATE_LIMIT_MAX ?? 60);

const bruteForceWindowMs = Number(
  process.env.AUTH_BRUTE_FORCE_WINDOW_MS ?? 600_000,
);
const bruteForceMaxFailures = Number(
  process.env.AUTH_BRUTE_FORCE_MAX_FAILURES ?? 5,
);
const bruteForceBlockMs = Number(
  process.env.AUTH_BRUTE_FORCE_BLOCK_MS ?? 1_800_000,
);

const readPositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
};

export const getClientIp = (request: Request) => {
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

const getSignInEmail = async (request: Request) => {
  try {
    // Request body stream ကို downstream handler လည်းဖတ်နိုင်ဖို့ clone() သုံးထားတယ်
    const body = (await request.clone().json()) as { email?: unknown };
    return typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : null;
  } catch {
    return null;
  }
};

type RateLimitWindow = {
  windowMs: number;
  max: number;
};

type RateLimitOptions = {
  namespace: string;
  keyId: string;
  windows: readonly RateLimitWindow[];
  message: string;
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

const enforceRateLimit = async (
  c: Parameters<MiddlewareHandler<AppBindings>>[0],
  options: RateLimitOptions,
) => {
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

  return null;
};

const apiRateLimitPerMinute = readPositiveInt(
  process.env.API_RATE_LIMIT_PER_MINUTE,
  300,
);
const apiRateLimitPerHour = readPositiveInt(
  process.env.API_RATE_LIMIT_PER_HOUR,
  5_000,
);

const workspaceCatalogPerMinute = readPositiveInt(
  process.env.WORKSPACE_CATALOG_RATE_LIMIT_PER_MINUTE,
  90,
);
const workspaceCatalogPerHour = readPositiveInt(
  process.env.WORKSPACE_CATALOG_RATE_LIMIT_PER_HOUR,
  1_800,
);
const workspacePracticeCreatePerMinute = readPositiveInt(
  process.env.WORKSPACE_PRACTICE_CREATE_RATE_LIMIT_PER_MINUTE,
  24,
);
const workspacePracticeCreatePerHour = readPositiveInt(
  process.env.WORKSPACE_PRACTICE_CREATE_RATE_LIMIT_PER_HOUR,
  300,
);
const workspacePaperCreatePerMinute = readPositiveInt(
  process.env.WORKSPACE_PAPER_CREATE_RATE_LIMIT_PER_MINUTE,
  12,
);
const workspacePaperCreatePerHour = readPositiveInt(
  process.env.WORKSPACE_PAPER_CREATE_RATE_LIMIT_PER_HOUR,
  180,
);
const workspacePaperSwapPerMinute = readPositiveInt(
  process.env.WORKSPACE_PAPER_SWAP_RATE_LIMIT_PER_MINUTE,
  60,
);
const workspacePaperSwapPerHour = readPositiveInt(
  process.env.WORKSPACE_PAPER_SWAP_RATE_LIMIT_PER_HOUR,
  1_200,
);
const workspacePaperPdfPerMinute = readPositiveInt(
  process.env.WORKSPACE_PAPER_PDF_RATE_LIMIT_PER_MINUTE,
  20,
);
const workspacePaperPdfPerHour = readPositiveInt(
  process.env.WORKSPACE_PAPER_PDF_RATE_LIMIT_PER_HOUR,
  240,
);
const workspaceDefaultPerMinute = readPositiveInt(
  process.env.WORKSPACE_DEFAULT_RATE_LIMIT_PER_MINUTE,
  180,
);
const workspaceDefaultPerHour = readPositiveInt(
  process.env.WORKSPACE_DEFAULT_RATE_LIMIT_PER_HOUR,
  2_500,
);

export const apiRateLimitMiddleware: MiddlewareHandler<AppBindings> = async (
  c,
  next,
) => {
  if (c.req.method === "OPTIONS") {
    await next();
    return;
  }

  const blocked = await enforceRateLimit(c, {
    namespace: "api",
    keyId: "v1",
    windows: [
      { windowMs: 60_000, max: apiRateLimitPerMinute },
      { windowMs: 3_600_000, max: apiRateLimitPerHour },
    ],
    message: "Too many API requests. Please slow down and try again.",
  });
  if (blocked) {
    return blocked;
  }

  await next();
};

const resolveWorkspaceRateKey = (method: string, path: string) => {
  if (method === "GET" && path.endsWith("/catalog")) {
    return "catalog";
  }
  if (method === "POST" && path.endsWith("/practice/sessions")) {
    return "practice-create";
  }
  if (method === "POST" && path.endsWith("/papers")) {
    return "paper-create";
  }
  if (
    method === "POST" &&
    /\/papers\/[^/]+\/items\/[^/]+\/swap$/.test(path)
  ) {
    return "paper-swap";
  }
  if (method === "GET" && /\/papers\/[^/]+\/pdf$/.test(path)) {
    return "paper-pdf";
  }
  return "default";
};

const workspaceRateWindowsByKey: Record<string, readonly RateLimitWindow[]> = {
  catalog: [
    { windowMs: 60_000, max: workspaceCatalogPerMinute },
    { windowMs: 3_600_000, max: workspaceCatalogPerHour },
  ],
  "practice-create": [
    { windowMs: 60_000, max: workspacePracticeCreatePerMinute },
    { windowMs: 3_600_000, max: workspacePracticeCreatePerHour },
  ],
  "paper-create": [
    { windowMs: 60_000, max: workspacePaperCreatePerMinute },
    { windowMs: 3_600_000, max: workspacePaperCreatePerHour },
  ],
  "paper-swap": [
    { windowMs: 60_000, max: workspacePaperSwapPerMinute },
    { windowMs: 3_600_000, max: workspacePaperSwapPerHour },
  ],
  "paper-pdf": [
    { windowMs: 60_000, max: workspacePaperPdfPerMinute },
    { windowMs: 3_600_000, max: workspacePaperPdfPerHour },
  ],
  default: [
    { windowMs: 60_000, max: workspaceDefaultPerMinute },
    { windowMs: 3_600_000, max: workspaceDefaultPerHour },
  ],
};

export const workspaceTrafficGuardMiddleware: MiddlewareHandler<AppBindings> =
  async (c, next) => {
    if (c.req.method === "OPTIONS") {
      await next();
      return;
    }

    const keyId = resolveWorkspaceRateKey(c.req.method, c.req.path);
    const blocked = await enforceRateLimit(c, {
      namespace: "workspace",
      keyId,
      windows: workspaceRateWindowsByKey[keyId] ?? workspaceRateWindowsByKey.default,
      message: "Too many workspace requests. Please try again shortly.",
    });
    if (blocked) {
      return blocked;
    }

    await next();
  };

export const authRateLimitMiddleware: MiddlewareHandler<AppBindings> = async (
  c,
  next,
) => {
  if (c.req.method === "OPTIONS") {
    await next();
    return;
  }

  const now = Date.now();

  const ip = getClientIp(c.req.raw);
  // Endpoint-by-endpoint quota သတ်မှတ်ဖို့ path ကို key ထဲထည့်ထားတယ်
  const key = `${ip}:${c.req.path}`;
  const counter = await securityStore.incrementRateLimit(
    key,
    rateLimitWindowMs,
    now,
  );

  if (counter.count > rateLimitMax) {
    c.res.headers.set(
      "retry-after",
      String(Math.ceil((counter.resetAt - now) / 1000)),
    );
    return c.json(
      { message: "Too many requests. Please try again later." },
      429,
    );
  }

  await next();
};

export const authBruteForceMiddleware: MiddlewareHandler<AppBindings> = async (
  c,
  next,
) => {
  if (c.req.method === "OPTIONS") {
    await next();
    return;
  }

  const now = Date.now();

  const ip = getClientIp(c.req.raw);
  const email = await getSignInEmail(c.req.raw);
  // IP only မဟုတ်ဘဲ email + IP တွဲပြီး key သုံးလို့ targeted attack ကိုတားနိုင်
  const key = `${ip}:${email ?? "unknown"}`;

  const state = await securityStore.getBruteForceState(key, now);
  if (state.blockedUntil && state.blockedUntil > now) {
    c.res.headers.set(
      "retry-after",
      String(Math.ceil((state.blockedUntil - now) / 1000)),
    );
    return c.json(
      {
        message:
          "Too many failed sign-in attempts. Please wait before trying again.",
      },
      429,
    );
  }

  await next();

  if (c.res.status < 400) {
    await securityStore.clearBruteForceState(key);
    return;
  }

  if (c.res.status !== 400 && c.res.status !== 401) {
    // 5xx/network error တွေကို failed credential attempt အဖြစ်မတွက်ဘူး
    return;
  }

  const result = await securityStore.registerBruteForceFailure(key, {
    now,
    windowMs: bruteForceWindowMs,
    maxFailures: bruteForceMaxFailures,
    blockMs: bruteForceBlockMs,
  });

  if (result.blockedUntil && result.blockedUntil > now) {
    c.res.headers.set(
      "retry-after",
      String(Math.ceil((result.blockedUntil - now) / 1000)),
    );
  }
};
