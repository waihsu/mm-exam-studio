import { getResolvedAppRuntime } from "@/lib/runtime";
import type { DbState } from "./adapters/db-state";

type DbAdapter = "node-postgres" | "neon-http";
type NodePgSslConfig = boolean | { rejectUnauthorized: boolean };

const rawDatabaseUrl =
  process.env.DATABASE_URL?.trim() ??
  "postgresql://neon:neon@localhost:5432/postgres";

const isCloudflareWorkerBuild =
  typeof __CLOUDFLARE_WORKER_BUILD__ !== "undefined" &&
  __CLOUDFLARE_WORKER_BUILD__ === true;

const LOCAL_DB_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const decodeBase64 = (encoded: string) => {
  const maybeAtob = (globalThis as { atob?: (value: string) => string }).atob;
  if (typeof maybeAtob === "function") {
    return maybeAtob(encoded);
  }
  return Buffer.from(encoded, "base64").toString("utf8");
};

const isLocalDatabaseUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return LOCAL_DB_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
};

const resolveDbAdapter = (): DbAdapter => {
  if (isCloudflareWorkerBuild || getResolvedAppRuntime() === "cloudflare-worker") {
    return "neon-http";
  }

  const configured = (process.env.DB_ADAPTER ?? "").trim().toLowerCase();
  if (
    configured === "node-postgres" ||
    configured === "postgres" ||
    configured === "pg" ||
    configured === "local"
  ) {
    return "node-postgres";
  }
  if (configured === "neon-http" || configured === "neon") {
    return "neon-http";
  }
  return isLocalDatabaseUrl(rawDatabaseUrl) ? "node-postgres" : "neon-http";
};

const resolveNodePgSsl = (value: string) => {
  const configured = (process.env.DB_SSL ?? "").trim().toLowerCase();
  if (configured === "false" || configured === "0" || configured === "disable") {
    return false;
  }
  if (
    configured === "allow-insecure" ||
    configured === "insecure" ||
    configured === "unsafe"
  ) {
    return { rejectUnauthorized: false };
  }
  if (
    configured === "true" ||
    configured === "1" ||
    configured === "require" ||
    configured === "verify-full"
  ) {
    return { rejectUnauthorized: true };
  }
  return isLocalDatabaseUrl(value) ? false : { rejectUnauthorized: true };
};

const getNodeAdapterSpecifier = () => {
  const globalSpecifier = (
    globalThis as unknown as Record<string, string | undefined>
  ).__mm_node_db_adapter_specifier__;
  if (typeof globalSpecifier === "string" && globalSpecifier.trim().length > 0) {
    return globalSpecifier;
  }

  return decodeBase64("Li9hZGFwdGVycy9ub2RlLXBvc3RncmVz");
};

const initializeDbState = async (): Promise<DbState> => {
  if (isCloudflareWorkerBuild) {
    const { createNeonHttpDbState } = await import("./adapters/neon-http");
    return createNeonHttpDbState(rawDatabaseUrl);
  }

  const adapter = resolveDbAdapter();

  if (adapter === "node-postgres") {
    const { createNodePostgresDbState } = (await import(
      getNodeAdapterSpecifier()
    )) as {
      createNodePostgresDbState: (params: {
        databaseUrl: string;
        ssl: NodePgSslConfig;
      }) => Promise<DbState>;
    };
    return await createNodePostgresDbState({
      databaseUrl: rawDatabaseUrl,
      ssl: resolveNodePgSsl(rawDatabaseUrl),
    });
  }

  const { createNeonHttpDbState } = await import("./adapters/neon-http");
  return createNeonHttpDbState(rawDatabaseUrl);
};

const state = await initializeDbState();

export const authDb = state.authDb;
export const db = state.db;
export const authSqlClient = state.authSqlClient;
export const closeAuthDb = state.closeAuthDb;

export * from "./auth-schema";
export * from "./app-schema";
