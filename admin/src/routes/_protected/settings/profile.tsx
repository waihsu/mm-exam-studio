import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ImagePlus, LoaderCircle, Star, Trash2 } from "lucide-react";
import { PagePanel } from "@/components/page-container";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { GlassAccountSettingsCard } from "@/components/uitripled/glass-account-settings";
import { GlassProfileSettingsCard } from "@/components/uitripled/glass-profile-settings";
import { ADMIN_ROUTES } from "@/constants/routes";
import { authApi } from "@/features/auth/api/auth-api";
import { useAuthFlow } from "@/features/auth/hooks/use-auth-flow";
import { brandingApi } from "@/features/branding/api/branding.api";
import type { BrandAsset } from "@/features/branding/types";

export const Route = createFileRoute("/_protected/settings/profile")({
  component: SettingsProfilePage,
});

function SettingsProfilePage() {
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

      <GlassAccountSettingsCard
        planLabel="Admin Console"
        planStatus={sessionsQuery.data?.ok ? "operational" : "check connectivity"}
        activeDevices={sessionsOverview?.sessions.length ?? 0}
        deviceLimit={Math.max((sessionsOverview?.sessions.length ?? 0) + 1, 2)}
        otherDevices={otherSessions.length}
        securityPath={ADMIN_ROUTES.settingsSecurity}
        subscriptionsPath={ADMIN_ROUTES.userSubscriptions}
      />

      <PagePanel className="space-y-4 border border-slate-200/70 bg-slate-50/70">
        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-900">Branding logos</h3>
          <p className="text-sm text-slate-600">
            Upload logos for paper header branding. You can mark one as primary.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px_auto] lg:items-end">
          <div className="space-y-2">
            <Label htmlFor="brand-logo-label">Logo label</Label>
            <Input
              id="brand-logo-label"
              value={logoLabel}
              onChange={(event) => setLogoLabel(event.target.value)}
              placeholder="School crest / Main logo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand-logo-file">Image file</Label>
            <Input
              ref={fileInputRef}
              id="brand-logo-file"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
              onChange={(event) =>
                setSelectedLogoFile(event.target.files?.[0] ?? null)
              }
            />
          </div>
          <Button
            type="button"
            onClick={() => {
              void handleUploadLogo();
            }}
            disabled={createBrandingMutation.isPending}
          >
            {createBrandingMutation.isPending ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="mr-2 h-4 w-4" />
            )}
            Upload logo
          </Button>
        </div>

        {brandingQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading branding assets...
          </div>
        ) : brandingQuery.error instanceof Error ? (
          <Alert variant="destructive">
            <AlertTitle>Branding unavailable</AlertTitle>
            <AlertDescription>{brandingQuery.error.message}</AlertDescription>
          </Alert>
        ) : brandAssets.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {brandAssets.map((asset) => (
              <BrandAssetCard
                key={asset.id}
                asset={asset}
                settingPrimary={
                  setPrimaryMutation.isPending &&
                  setPrimaryMutation.variables === asset.id
                }
                deleting={
                  deleteMutation.isPending &&
                  deleteMutation.variables === asset.id
                }
                onSetPrimary={() => {
                  void setPrimaryMutation.mutateAsync(asset.id);
                }}
                onDelete={() => {
                  void deleteMutation.mutateAsync(asset.id);
                }}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            No logo uploaded yet. Add one to use it in generated papers.
          </p>
        )}
      </PagePanel>

      {sessionsQuery.data && !sessionsQuery.data.ok ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {sessionsQuery.data.message}
        </div>
      ) : null}
    </PagePanel>
  );
}

function BrandAssetCard({
  asset,
  settingPrimary,
  deleting,
  onSetPrimary,
  onDelete,
}: {
  asset: BrandAsset;
  settingPrimary: boolean;
  deleting: boolean;
  onSetPrimary: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <img
          src={asset.imageDataUrl}
          alt={asset.label}
          className="h-28 w-full object-contain"
          loading="lazy"
        />
      </div>
      <div className="space-y-1">
        <p className="line-clamp-1 text-sm font-semibold text-slate-900">{asset.label}</p>
        <p className="text-xs text-slate-500">
          Added {new Date(asset.createdAt).toLocaleString()}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {asset.isPrimary ? (
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
            <Star className="mr-1 h-3.5 w-3.5" />
            Primary
          </Badge>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={settingPrimary || deleting}
            onClick={onSetPrimary}
          >
            {settingPrimary ? (
              <LoaderCircle className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Star className="mr-1 h-3.5 w-3.5" />
            )}
            Set primary
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-rose-200 text-rose-700 hover:bg-rose-50"
          disabled={deleting || settingPrimary}
          onClick={onDelete}
        >
          {deleting ? (
            <LoaderCircle className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="mr-1 h-3.5 w-3.5" />
          )}
          Delete
        </Button>
      </div>
    </div>
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
