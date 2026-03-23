import type { CatalogQueryParams } from "../types/practice.types";

export const PRACTICE_QUERY_KEYS = {
  root: ["practice"] as const,
  catalog: (params: CatalogQueryParams) => ["practice", "catalog", params] as const,
  sessions: () => ["practice", "sessions"] as const,
  session: (sessionId: string) => ["practice", "session", sessionId] as const,
};

