import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgRemoteDatabase } from "drizzle-orm/pg-proxy";
import type { schema } from "../schema";

export type AppDatabase =
  | PgRemoteDatabase<typeof schema>
  | NodePgDatabase<typeof schema>;

export type DbState = {
  authDb: AppDatabase;
  db: AppDatabase;
  authSqlClient: unknown;
  closeAuthDb: () => Promise<void>;
};
