import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type {
  AdminSupportConversation,
  PaginatedAdminSupportConversationResult,
} from "../types";

export type SupportConversationListCacheEntry = [
  QueryKey,
  PaginatedAdminSupportConversationResult | undefined,
];

export function compareConversationActivity(
  left: AdminSupportConversation,
  right: AdminSupportConversation,
) {
  return (
    new Date(right.lastMessageAt ?? right.updatedAt).getTime() -
    new Date(left.lastMessageAt ?? left.updatedAt).getTime()
  );
}

export function getSupportConversationListCacheEntries(queryClient: QueryClient) {
  return queryClient.getQueriesData<PaginatedAdminSupportConversationResult>({
    queryKey: ["admin-support-conversations"],
  }) as SupportConversationListCacheEntry[];
}

export function syncSupportConversationListCaches(
  queryClient: QueryClient,
  conversation: AdminSupportConversation,
) {
  const cacheEntries = getSupportConversationListCacheEntries(queryClient);

  for (const [cacheKey, cached] of cacheEntries) {
    if (!cached) continue;

    const [, , statusFilter] = cacheKey as [string, string, "all" | "open" | "closed"];
    const rowIndex = cached.rows.findIndex((row) => row.id === conversation.id);
    if (rowIndex === -1) continue;

    const matchesStatus = statusFilter === "all" || statusFilter === conversation.status;
    const nextRows = [...cached.rows];
    let nextTotal = cached.total;

    if (!matchesStatus) {
      nextRows.splice(rowIndex, 1);
      nextTotal = Math.max(0, nextTotal - 1);
    } else {
      nextRows[rowIndex] = conversation;
      nextRows.sort(compareConversationActivity);
    }

    queryClient.setQueryData(cacheKey, { ...cached, rows: nextRows, total: nextTotal });
  }
}

export function restoreSupportConversationListCaches(
  queryClient: QueryClient,
  cacheEntries: SupportConversationListCacheEntry[],
) {
  for (const [cacheKey, cached] of cacheEntries) {
    queryClient.setQueryData(cacheKey, cached);
  }
}
