import type { ChangeEvent, RefObject } from "react";
import { ImagePlus, LoaderCircle, Star, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PagePanel } from "@/components/page-container";
import type { BrandAsset } from "@/features/branding/types";

type BrandingLogosPanelProps = {
  assets: BrandAsset[];
  logoLabel: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  isLoading: boolean;
  error: Error | null;
  isUploading: boolean;
  settingPrimaryId?: string;
  deletingId?: string;
  onLogoLabelChange: (value: string) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onSetPrimary: (assetId: string) => void;
  onDelete: (assetId: string) => void;
};

export function BrandingLogosPanel({
  assets,
  logoLabel,
  fileInputRef,
  isLoading,
  error,
  isUploading,
  settingPrimaryId,
  deletingId,
  onLogoLabelChange,
  onFileChange,
  onUpload,
  onSetPrimary,
  onDelete,
}: BrandingLogosPanelProps) {
  return (
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
            onChange={(event) => onLogoLabelChange(event.target.value)}
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
            onChange={onFileChange}
          />
        </div>
        <Button type="button" onClick={onUpload} disabled={isUploading}>
          {isUploading ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="mr-2 h-4 w-4" />
          )}
          Upload logo
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading branding assets...
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Branding unavailable</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : assets.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <BrandAssetCard
              key={asset.id}
              asset={asset}
              settingPrimary={settingPrimaryId === asset.id}
              deleting={deletingId === asset.id}
              onSetPrimary={() => onSetPrimary(asset.id)}
              onDelete={() => onDelete(asset.id)}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-600">
          No logo uploaded yet. Add one to use it in generated papers.
        </p>
      )}
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
        <p className="text-xs text-slate-500">Added {new Date(asset.createdAt).toLocaleString()}</p>
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
