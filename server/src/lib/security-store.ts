import { isCloudflareWorkerRuntime } from "./runtime";

type RateLimitCounter = {
  count: number;
  resetAt: number;
};

type BruteForceState = {
  blockedUntil: number | null;
};

type RegisterFailureInput = {
  now: number;
  windowMs: number;
  maxFailures: number;
  blockMs: number;
};

type RegisterFailureResult = {
  failedCount: number;
  blockedUntil: number | null;
};

export interface SecurityStore {
  incrementRateLimit(key: string, windowMs: number, now: number): Promise<RateLimitCounter>;
  getBruteForceState(key: string, now: number): Promise<BruteForceState>;
  registerBruteForceFailure(
    key: string,
    input: RegisterFailureInput,
  ): Promise<RegisterFailureResult>;
  clearBruteForceState(key: string): Promise<void>;
}

type RedisLikeClient = {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: "EX", seconds: number): Promise<"OK" | null>;
  del(...keys: string[]): Promise<number>;
};

export class MemorySecurityStore implements SecurityStore {
  private readonly counters = new Map<string, RateLimitCounter>();
  private readonly bruteForceFailures = new Map<
    string,
    {
      failedCount: number;
      windowStartedAt: number;
      windowExpiresAt: number;
      blockedUntil: number;
    }
  >();

  async incrementRateLimit(key: string, windowMs: number, now: number) {
    const current = this.counters.get(key);
    if (!current || current.resetAt <= now) {
      const next = { count: 1, resetAt: now + windowMs };
      this.counters.set(key, next);
      return next;
    }

    current.count += 1;
    return current;
  }

  async getBruteForceState(key: string, now: number) {
    const current = this.bruteForceFailures.get(key);
    if (!current) {
      return { blockedUntil: null };
    }

    const windowExpired = current.windowExpiresAt <= now;
    const blockExpired = current.blockedUntil <= now;
    if (windowExpired && blockExpired) {
      this.bruteForceFailures.delete(key);
      return { blockedUntil: null };
    }

    return {
      blockedUntil: current.blockedUntil > now ? current.blockedUntil : null,
    };
  }

  async registerBruteForceFailure(key: string, input: RegisterFailureInput) {
    const { now, windowMs, maxFailures, blockMs } = input;
    const current = this.bruteForceFailures.get(key);
    if (!current || current.windowStartedAt + windowMs <= now) {
      const next = {
        failedCount: 1,
        windowStartedAt: now,
        windowExpiresAt: now + windowMs,
        blockedUntil: 0,
      };
      this.bruteForceFailures.set(key, next);
      return { failedCount: next.failedCount, blockedUntil: null };
    }

    current.failedCount += 1;
    if (current.failedCount >= maxFailures) {
      current.blockedUntil = now + blockMs;
      return { failedCount: current.failedCount, blockedUntil: current.blockedUntil };
    }

    return { failedCount: current.failedCount, blockedUntil: null };
  }

  async clearBruteForceState(key: string) {
    this.bruteForceFailures.delete(key);
  }
}

class FallbackSecurityStore implements SecurityStore {
  private warned = false;

  constructor(
    private readonly primary: SecurityStore,
    private readonly fallback: SecurityStore,
  ) {}

  private async usePrimaryOrFallback<T>(
    primaryAction: () => Promise<T>,
    fallbackAction: () => Promise<T>,
  ): Promise<T> {
    try {
      return await primaryAction();
    } catch (error) {
      if (!this.warned) {
        this.warned = true;
        console.warn(
          "[security-store] primary store failed, switched to in-memory fallback",
          error,
        );
      }
      return fallbackAction();
    }
  }

  async incrementRateLimit(key: string, windowMs: number, now: number) {
    return this.usePrimaryOrFallback(
      () => this.primary.incrementRateLimit(key, windowMs, now),
      () => this.fallback.incrementRateLimit(key, windowMs, now),
    );
  }

  async getBruteForceState(key: string, now: number) {
    return this.usePrimaryOrFallback(
      () => this.primary.getBruteForceState(key, now),
      () => this.fallback.getBruteForceState(key, now),
    );
  }

  async registerBruteForceFailure(key: string, input: RegisterFailureInput) {
    return this.usePrimaryOrFallback(
      () => this.primary.registerBruteForceFailure(key, input),
      () => this.fallback.registerBruteForceFailure(key, input),
    );
  }

  async clearBruteForceState(key: string) {
    return this.usePrimaryOrFallback(
      () => this.primary.clearBruteForceState(key),
      () => this.fallback.clearBruteForceState(key),
    );
  }
}

class UpstashSecurityStore implements SecurityStore {
  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}

  private async command<T>(
    command: string,
    args: Array<string | number>,
    query?: Record<string, string | number>,
  ): Promise<T> {
    const encodedArgs = args.map((arg) => encodeURIComponent(String(arg))).join("/");
    const queryString = query
      ? (() => {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(query)) {
            params.set(key, String(value));
          }
          return `?${params.toString()}`;
        })()
      : "";

    const response = await fetch(
      `${this.url.replace(/\/+$/, "")}/${command}/${encodedArgs}${queryString}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      },
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Upstash ${command} failed: ${response.status} ${body}`);
    }

    const json = (await response.json()) as { result: T };
    return json.result;
  }

  async incrementRateLimit(key: string, windowMs: number, now: number) {
    const bucketStart = Math.floor(now / windowMs) * windowMs;
    const resetAt = bucketStart + windowMs;
    const bucketKey = `rl:${key}:${bucketStart}`;

    const count = Number(await this.command<number>("incr", [bucketKey]));
    if (count === 1) {
      await this.command<number>("expire", [
        bucketKey,
        Math.max(Math.ceil(windowMs / 1000), 1),
      ]);
    }

    return { count, resetAt };
  }

  async getBruteForceState(key: string, now: number) {
    const blockKey = `bf:block:${key}`;
    const blockValue = await this.command<string | null>("get", [blockKey]);
    if (!blockValue) {
      return { blockedUntil: null };
    }

    const blockedUntil = Number(blockValue);
    if (!Number.isFinite(blockedUntil) || blockedUntil <= now) {
      return { blockedUntil: null };
    }
    return { blockedUntil };
  }

  async registerBruteForceFailure(key: string, input: RegisterFailureInput) {
    const { now, windowMs, maxFailures, blockMs } = input;
    const failureKey = `bf:fail:${key}`;
    const blockKey = `bf:block:${key}`;

    const failedCount = Number(await this.command<number>("incr", [failureKey]));
    if (failedCount === 1) {
      await this.command<number>("expire", [
        failureKey,
        Math.max(Math.ceil(windowMs / 1000), 1),
      ]);
    }

    if (failedCount >= maxFailures) {
      const blockedUntil = now + blockMs;
      await this.command<string>("set", [blockKey, String(blockedUntil)], {
        EX: Math.max(Math.ceil(blockMs / 1000), 1),
      });
      return { failedCount, blockedUntil };
    }

    return { failedCount, blockedUntil: null };
  }

  async clearBruteForceState(key: string) {
    await Promise.all([
      this.command<number>("del", [`bf:fail:${key}`]),
      this.command<number>("del", [`bf:block:${key}`]),
    ]);
  }
}

type BunRedisClientConstructor = new (url?: string) => RedisLikeClient & {
  connect?: () => Promise<void>;
};

const loadBunRedisClient = async (): Promise<BunRedisClientConstructor> => {
  const bunRuntime = (globalThis as { Bun?: { RedisClient?: BunRedisClientConstructor } }).Bun;
  if (bunRuntime?.RedisClient) {
    return bunRuntime.RedisClient;
  }

  // "bun" module ကို static import မလုပ်ဘဲ runtime dynamic import သုံးတာက
  // Cloudflare build အချိန် module resolution error မထွက်အောင်ကာကွယ်ဖို့
  const importer = new Function(
    "moduleName",
    "return import(moduleName)",
  ) as (moduleName: string) => Promise<unknown>;
  const bunModule = (await importer("bun")) as {
    RedisClient?: BunRedisClientConstructor;
  };
  if (!bunModule.RedisClient) {
    throw new Error("Bun RedisClient is not available in this runtime");
  }
  return bunModule.RedisClient;
};

class BunRedisSecurityStore implements SecurityStore {
  private clientPromise: Promise<RedisLikeClient> | null = null;

  constructor(private readonly redisUrl: string) {}

  private async getClient() {
    if (!this.clientPromise) {
      this.clientPromise = (async () => {
        const RedisClient = await loadBunRedisClient();
        const client = new RedisClient(this.redisUrl);
        if (typeof client.connect === "function") {
          await client.connect();
        }
        return client;
      })();
    }
    return this.clientPromise;
  }

  async incrementRateLimit(key: string, windowMs: number, now: number) {
    const bucketStart = Math.floor(now / windowMs) * windowMs;
    const resetAt = bucketStart + windowMs;
    const bucketKey = `rl:${key}:${bucketStart}`;
    const client = await this.getClient();

    const count = Number(await client.incr(bucketKey));
    if (count === 1) {
      await client.expire(bucketKey, Math.max(Math.ceil(windowMs / 1000), 1));
    }

    return { count, resetAt };
  }

  async getBruteForceState(key: string, now: number) {
    const client = await this.getClient();
    const blockValue = await client.get(`bf:block:${key}`);
    if (!blockValue) {
      return { blockedUntil: null };
    }

    const blockedUntil = Number(blockValue);
    if (!Number.isFinite(blockedUntil) || blockedUntil <= now) {
      return { blockedUntil: null };
    }
    return { blockedUntil };
  }

  async registerBruteForceFailure(key: string, input: RegisterFailureInput) {
    const { now, windowMs, maxFailures, blockMs } = input;
    const failureKey = `bf:fail:${key}`;
    const blockKey = `bf:block:${key}`;
    const client = await this.getClient();

    const failedCount = Number(await client.incr(failureKey));
    if (failedCount === 1) {
      await client.expire(failureKey, Math.max(Math.ceil(windowMs / 1000), 1));
    }

    if (failedCount >= maxFailures) {
      const blockedUntil = now + blockMs;
      await client.set(
        blockKey,
        String(blockedUntil),
        "EX",
        Math.max(Math.ceil(blockMs / 1000), 1),
      );
      return { failedCount, blockedUntil };
    }

    return { failedCount, blockedUntil: null };
  }

  async clearBruteForceState(key: string) {
    const client = await this.getClient();
    await client.del(`bf:fail:${key}`, `bf:block:${key}`);
  }
}

let hasWarnedAboutSecurityStoreFallback = false;

const warnSecurityStoreFallback = (message: string) => {
  if (hasWarnedAboutSecurityStoreFallback) return;
  hasWarnedAboutSecurityStoreFallback = true;
  console.warn(`[security-store] ${message}`);
};

const createSecurityStore = (): SecurityStore => {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  const redisUrl =
    process.env.UPSTASH_REDIS_URL?.trim() ?? process.env.REDIS_URL?.trim();
  const isProduction =
    (process.env.NODE_ENV ?? "development").trim().toLowerCase() === "production";
  const allowInsecureFallback =
    (process.env.ALLOW_INSECURE_MEMORY_SECURITY_STORE ?? "false")
      .trim()
      .toLowerCase() === "true";
  const fallbackStore = new MemorySecurityStore();

  const requireExternalStore = () => {
    if (!isProduction || allowInsecureFallback) {
      return;
    }

    throw new Error(
      "Production security requires Redis or Upstash-backed rate limiting. Configure UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN or REDIS_URL.",
    );
  };

  const resolveFromRedisUrl = () => {
    if (!redisUrl) return null;
    try {
      const parsed = new URL(redisUrl);
      const isUpstashHost = parsed.hostname.includes("upstash.io");
      if (!isUpstashHost) return null;
      const password = parsed.password ? decodeURIComponent(parsed.password) : "";
      if (!password) return null;
      // Upstash TCP URL (rediss://default:<token>@host:6379) ရှိရင် REST endpoint ကို host တူတူနဲ့ derive လုပ်နိုင်
      return {
        url: `https://${parsed.hostname}`,
        token: password,
      };
    } catch {
      return null;
    }
  };

  if (url && token) {
    return new FallbackSecurityStore(
      new UpstashSecurityStore(url, token),
      fallbackStore,
    );
  }

  const derived = resolveFromRedisUrl();
  if (derived) {
    return new FallbackSecurityStore(
      new UpstashSecurityStore(derived.url, derived.token),
      fallbackStore,
    );
  }

  if (isCloudflareWorkerRuntime()) {
    requireExternalStore();
    warnSecurityStoreFallback(
      "Cloudflare Worker runtime has no Upstash REST configuration. Falling back to in-memory throttling only.",
    );
    return fallbackStore;
  }

  if (redisUrl) {
    return new FallbackSecurityStore(
      new BunRedisSecurityStore(redisUrl),
      fallbackStore,
    );
  }

  requireExternalStore();
  warnSecurityStoreFallback(
    "No Redis or Upstash security store configured. Falling back to in-memory throttling only.",
  );
  return fallbackStore;
};

export const securityStore = createSecurityStore();
