import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PagePanel } from "@/components/page-container";
import { toast } from "@/components/ui/sonner";
import { GlassProfileSettingsCard } from "@/components/uitripled/glass-profile-settings";
import { ADMIN_ROUTES } from "@/constants/routes";
import { authApi } from "@/features/auth/api/auth-api";
import { useAuthFlow } from "@/features/auth/hooks/use-auth-flow";
import { brandingApi } from "@/features/branding/api/branding.api";
import { BrandingLogosPanel } from "@/features/settings/components/branding-logos-panel";

export function ProfileSettingsPage() {
  const queryClient = useQueryClient();
  const { user, roles, apiMessage, callProtectedApi } = useAuthFlow();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [logoLabel, setLogoLabel] = useState("");
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);

  const sessionsQuery = useQuery({
    queryKey: ["admin-auth-sessions-profile"],
    queryFn: () => authApi.listSessions(),
  });
  const brandingQuery = useQuery({
    queryKey: ["admin-workspace-branding"],
    queryFn: async () => {
      const response = await brandingApi.list();
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });

  const createBrandingMutation = useMutation({
    mutationFn: async (payload: { label: string; imageDataUrl: string }) => {
      const response = await brandingApi.create(payload);
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: async () => {
      toast.success("Logo uploaded.");
      setLogoLabel("");
      setSelectedLogoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await queryClient.invalidateQueries({ queryKey: ["admin-workspace-branding"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to upload logo.");
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (brandAssetId: string) => {
      const response = await brandingApi.setPrimary(brandAssetId);
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: async () => {
      toast.success("Primary logo updated.");
      await queryClient.invalidateQueries({ queryKey: ["admin-workspace-branding"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update primary logo.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (brandAssetId: string) => {
      const response = await brandingApi.delete(brandAssetId);
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: async () => {
      toast.success("Logo removed.");
      await queryClient.invalidateQueries({ queryKey: ["admin-workspace-branding"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete logo.");
    },
  });

  const sessionsOverview = sessionsQuery.data?.ok ? sessionsQuery.data.data : null;
  const currentSessionId = sessionsOverview?.currentSessionId ?? null;
  const otherSessions = sessionsOverview?.sessions.filter((item) => item.id !== currentSessionId) ?? [];
  const brandAssets = brandingQuery.data?.rows ?? [];
  const accessLabel = roles.includes("superadmin")
    ? "Super Admin"
    : roles.includes("admin")
      ? "Admin"
      : "Limited";

  const handleUploadLogo = async () => {
    if (!selectedLogoFile) {
      toast.error("Choose an image file first.");
      return;
    }

    const trimmedLabel = logoLabel.trim();
    if (!trimmedLabel) {
      toast.error("Enter a label for this logo.");
      return;
    }

    const allowedMimeTypes = new Set([
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/svg+xml",
    ]);

    if (!allowedMimeTypes.has(selectedLogoFile.type)) {
      toast.error("Allowed types: PNG, JPG, WEBP, SVG.");
      return;
    }

    if (selectedLogoFile.size > 850_000) {
      toast.error("Logo file is too large. Keep it below 850 KB.");
      return;
    }

    const imageDataUrl = await readFileAsDataUrl(selectedLogoFile);
    await createBrandingMutation.mutateAsync({
      label: trimmedLabel,
      imageDataUrl,
    });
  };

  return (
    <PagePanel className="space-y-5 bg-white/88">
      <GlassProfileSettingsCard
        name={user?.name || "Admin User"}
        email={user?.email || "No email"}
        userId={user?.id || "Unavailable"}
        accessLabel={accessLabel}
        roles={roles}
        activeSessions={sessionsOverview?.sessions.length ?? 0}
        otherDevices={otherSessions.length}
        sessionStatus={sessionsQuery.isLoading ? "loading" : sessionsQuery.data?.ok ? "live" : "error"}
        securityPath={ADMIN_ROUTES.settingsSecurity}
        usersPath={ADMIN_ROUTES.users}
        onVerifyProtectedApi={() => {
          void callProtectedApi();
        }}
        verifyMessage={apiMessage}
      />

      <BrandingLogosPanel
        assets={brandAssets}
        logoLabel={logoLabel}
        fileInputRef={fileInputRef}
        isLoading={brandingQuery.isLoading}
        error={brandingQuery.error instanceof Error ? brandingQuery.error : null}
        isUploading={createBrandingMutation.isPending}
        settingPrimaryId={
          setPrimaryMutation.isPending ? setPrimaryMutation.variables : undefined
        }
        deletingId={deleteMutation.isPending ? deleteMutation.variables : undefined}
        onLogoLabelChange={setLogoLabel}
        onFileChange={(event) => setSelectedLogoFile(event.target.files?.[0] ?? null)}
        onUpload={() => {
          void handleUploadLogo();
        }}
        onSetPrimary={(assetId) => {
          void setPrimaryMutation.mutateAsync(assetId);
        }}
        onDelete={(assetId) => {
          void deleteMutation.mutateAsync(assetId);
        }}
      />

      {sessionsQuery.data && !sessionsQuery.data.ok ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {sessionsQuery.data.message}
        </div>
      ) : null}
    </PagePanel>
  );
}

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = reader.result;
      if (typeof value === "string" && value.length > 0) {
        resolve(value);
        return;
      }
      reject(new Error("Failed to read selected file."));
    };
    reader.onerror = () => reject(new Error("Failed to read selected file."));
    reader.readAsDataURL(file);
  });
