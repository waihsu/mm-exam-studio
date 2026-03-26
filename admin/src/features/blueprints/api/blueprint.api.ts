import { api } from "@/lib/api-client";
import type {
  MaterializedBlueprintResult,
  MaterializeBlueprintInput,
  PaperBlueprintDetail,
  PaperBlueprintListResult,
  PaperBlueprintPreviewSummary,
  PaperBlueprintSubmitInput,
  WorkspacePaperDetail,
  WorkspacePaperStatus,
} from "../types";

export const blueprintApi = {
  getBlueprints: () => api.get<PaperBlueprintListResult>("/workspace/paper-blueprints"),
  getBlueprint: (blueprintId: string) =>
    api.get<PaperBlueprintDetail>(
      `/workspace/paper-blueprints/${encodeURIComponent(blueprintId)}`,
    ),
  getPreviewSummary: (blueprintId: string) =>
    api.get<PaperBlueprintPreviewSummary>(
      `/workspace/paper-blueprints/${encodeURIComponent(blueprintId)}/preview-summary`,
    ),
  createBlueprint: (input: PaperBlueprintSubmitInput) =>
    api.post<PaperBlueprintDetail>("/workspace/paper-blueprints", input),
  updateBlueprint: (blueprintId: string, input: Partial<PaperBlueprintSubmitInput>) =>
    api.patch<PaperBlueprintDetail>(
      `/workspace/paper-blueprints/${encodeURIComponent(blueprintId)}`,
      input,
    ),
  deleteBlueprint: (blueprintId: string) =>
    api.delete<{ success: true; id: string }>(
      `/workspace/paper-blueprints/${encodeURIComponent(blueprintId)}`,
    ),
  materializeBlueprint: (blueprintId: string, input: MaterializeBlueprintInput) =>
    api.post<MaterializedBlueprintResult>(
      `/workspace/paper-blueprints/${encodeURIComponent(blueprintId)}/materialize`,
      input,
    ),
  getPaperDetail: (paperId: string) =>
    api.get<WorkspacePaperDetail>(`/workspace/papers/${encodeURIComponent(paperId)}`),
  updatePaperStatus: (paperId: string, status: WorkspacePaperStatus) =>
    api.post<WorkspacePaperDetail>(`/workspace/papers/${encodeURIComponent(paperId)}/status`, {
      status,
    }),
  deletePaper: (paperId: string) =>
    api.delete<{ success: true; id: string }>(`/workspace/papers/${encodeURIComponent(paperId)}`),
};
