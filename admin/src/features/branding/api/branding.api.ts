import { api } from "@/lib/api-client";
import type {
  BrandAsset,
  BrandAssetListResult,
  CreateBrandAssetInput,
} from "../types";

export const brandingApi = {
  list: () => api.get<BrandAssetListResult>("/workspace/branding"),
  create: (input: CreateBrandAssetInput) =>
    api.post<BrandAsset>("/workspace/branding", input),
  setPrimary: (brandAssetId: string) =>
    api.post<BrandAssetListResult>("/workspace/branding/primary", { brandAssetId }),
  delete: (brandAssetId: string) =>
    api.delete<BrandAssetListResult>(
      `/workspace/branding/${encodeURIComponent(brandAssetId)}`,
    ),
};
