export const PAPERS_QUERY_KEYS = {
  root: ["papers"] as const,
  list: () => ["papers", "list"] as const,
  detail: (paperId: string) => ["papers", "detail", paperId] as const,
  exported: () => ["papers", "exported"] as const,
  swapCandidates: (paperId: string, itemId: string) =>
    ["papers", "swap-candidates", paperId, itemId] as const,
};
