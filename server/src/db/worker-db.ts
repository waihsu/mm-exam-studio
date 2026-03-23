import type { DbState } from "./adapters/db-state";

const rawDatabaseUrl =
  process.env.DATABASE_URL?.trim() ??
  "postgresql://neon:neon@localhost:5432/postgres";

const initializeDbState = async (): Promise<DbState> => {
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
