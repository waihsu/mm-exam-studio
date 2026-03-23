import { useRef, useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppAuthSnapshot } from "@/features/auth/context/app-auth-context";
import { workspaceApi } from "@/features/workspace/api/workspace-api";

const WORKSPACE_SUMMARY_QUERY_KEY = ["workspace-summary"] as const;
const WORKSPACE_BRANDING_QUERY_KEY = ["workspace-branding"] as const;

export function useSettingsPageData() {
  const auth = useAppAuthSnapshot();
  const user = auth?.user;
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [label, setLabel] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");

  const summaryQuery = useQuery({
    queryKey: WORKSPACE_SUMMARY_QUERY_KEY,
    queryFn: () => workspaceApi.getSummary(),
  });
  const brandingQuery = useQuery({
    queryKey: WORKSPACE_BRANDING_QUERY_KEY,
    queryFn: () => workspaceApi.listBrandAssets(),
  });

  const createMutation = useMutation({
    mutationFn: () => workspaceApi.createBrandAsset({ label, imageDataUrl }),
    onSuccess: async (response) => {
      if (!response.ok) return;
      setLabel("");
      setImageDataUrl("");
      setSelectedFileName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: WORKSPACE_BRANDING_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: WORKSPACE_SUMMARY_QUERY_KEY }),
      ]);
    },
  });
  const primaryMutation = useMutation({
    mutationFn: (brandAssetId: string) => workspaceApi.setPrimaryBrandAsset(brandAssetId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: WORKSPACE_BRANDING_QUERY_KEY });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (brandAssetId: string) => workspaceApi.deleteBrandAsset(brandAssetId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: WORKSPACE_BRANDING_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: WORKSPACE_SUMMARY_QUERY_KEY }),
      ]);
    },
  });

  const summary = summaryQuery.data?.ok ? summaryQuery.data.data : null;
  const brandAssets = brandingQuery.data?.ok ? brandingQuery.data.data.rows : [];
  const brandingLimit = summary?.subscription.limits.brandingLogoLimit ?? 0;
  const remainingBrandSlots = Math.max(brandingLimit - (summary?.brandingCount ?? 0), 0);
  const isEmailVerified = Boolean(user?.emailVerified);
  const accountStatus = user?.accountStatus ?? "active";
  const accountStatusChangedAt = user?.accountStatusChangedAt
    ? new Date(user.accountStatusChangedAt).toLocaleDateString("en-US")
    : null;
  const canUpload = brandingLimit > 0 && !!label.trim() && !!imageDataUrl && !createMutation.isPending;

  const onLogoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImageDataUrl("");
      setSelectedFileName("");
      return;
    }

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setImageDataUrl(result);
    };
    reader.readAsDataURL(file);
  };

  return {
    auth,
    user,
    fileInputRef,
    label,
    setLabel,
    selectedFileName,
    imageDataUrl,
    summary,
    brandAssets,
    brandingLimit,
    remainingBrandSlots,
    isEmailVerified,
    accountStatus,
    accountStatusChangedAt,
    canUpload,
    createMutation,
    primaryMutation,
    deleteMutation,
    onLogoFileChange,
  };
}
