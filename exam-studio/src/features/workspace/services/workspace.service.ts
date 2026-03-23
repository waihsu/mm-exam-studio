import { apiRequest } from "@/lib/api-client";
import type {
  WorkspaceMetaResponse,
  WorkspaceSummaryResponse,
} from "../types/workspace.types";

export const getWorkspaceMeta = () =>
  apiRequest<WorkspaceMetaResponse>("/api/v1/workspace/meta");

export const getWorkspaceSummary = () =>
  apiRequest<WorkspaceSummaryResponse>("/api/v1/workspace/summary");
