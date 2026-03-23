import type { DbState } from "./db-state";
import { schema } from "../schema";

type NodePgSslConfig = boolean | { rejectUnauthorized: boolean };

const decodeBase64 = (encoded: string) => {
  const maybeAtob = (globalThis as { atob?: (value: string) => string }).atob;
  if (typeof maybeAtob === "function") {
    return maybeAtob(encoded);
  }
  return Buffer.from(encoded, "base64").toString("utf8");
};

const getNodePostgresDriverSpecifier = () => {
  const globalSpecifier = (
    globalThis as unknown as Record<string, string | undefined>
  ).__mm_node_postgres_driver_specifier__;
  if (typeof globalSpecifier === "string" && globalSpecifier.trim().length > 0) {
    return globalSpecifier;
  }

  return decodeBase64("ZHJpenpsZS1vcm0vbm9kZS1wb3N0Z3Jlcw==");
};

const getPgSpecifier = () => {
  const globalSpecifier = (
    globalThis as unknown as Record<string, string | undefined>
  ).__mm_pg_specifier__;
  if (typeof globalSpecifier === "string" && globalSpecifier.trim().length > 0) {
    return globalSpecifier;
  }

  return decodeBase64("cGc=");
};

export const createNodePostgresDbState = async (params: {
  databaseUrl: string;
  ssl: NodePgSslConfig;
}): Promise<DbState> => {
  const drizzleModule = (await import(
    getNodePostgresDriverSpecifier()
  )) as typeof import("drizzle-orm/node-postgres");
  const pgModule = (await import(getPgSpecifier())) as typeof import("pg");

  const pool = new pgModule.Pool({
    connectionString: params.databaseUrl,
    ssl: params.ssl,
  });

  pool.on("error", (error) => {
    console.error("[postgres] pool error", error);
  });

  const authDb = drizzleModule.drizzle({ client: pool, schema });

  return {
    authDb,
    db: authDb,
    authSqlClient: pool,
    closeAuthDb: async () => {
      await pool.end();
    },
  };
};
