import type { PaperBlueprintListRow } from "./types";

export type BlueprintListOverview = {
  total: number;
  readyCount: number;
  customCount: number;
  issueCandidateCount: number;
};

export function getBlueprintListOverview(rows: PaperBlueprintListRow[]): BlueprintListOverview {
  return {
    total: rows.length,
    readyCount: rows.filter((row) => row.status === "ready").length,
    customCount: rows.filter((row) => row.mode === "custom").length,
    issueCandidateCount: rows.filter(
      (row) => row.status !== "ready" && row.generatedPaperCount < 1,
    ).length,
  };
}
