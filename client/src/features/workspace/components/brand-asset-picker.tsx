import { Link } from "@tanstack/react-router";
import { ImageOff } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { BrandAsset } from "../types";

type BrandAssetPickerProps = {
  assets: BrandAsset[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  noneLabel?: string;
};

export function BrandAssetPicker({
  assets,
  value,
  onChange,
  disabled = false,
  noneLabel = "Use default header",
}: BrandAssetPickerProps) {
  if (assets.length === 0) {
    return (
      <EmptyState
        title="No saved logos yet"
        description="Upload a logo in branding before attaching one to a paper."
        icon={ImageOff}
        action={
          <Link
            to="/settings"
            className="inline-flex text-sm font-semibold text-slate-900 underline-offset-4 hover:underline"
          >
            Open branding
          </Link>
        }
        className="p-4"
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("")}
        className={`rounded-lg border px-4 py-4 text-left transition ${
          value === ""
            ? "border-slate-900 bg-slate-900 text-white"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
        }`}
      >
        <p className="text-sm font-semibold">{noneLabel}</p>
        <p className={`mt-1 text-xs ${value === "" ? "text-slate-200" : "text-slate-500"}`}>
          Clean header with school name only.
        </p>
      </button>

      {assets.map((asset) => {
        const selected = value === asset.id;
        return (
          <button
            key={asset.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(asset.id)}
            className={`rounded-lg border px-4 py-4 text-left transition ${
              selected
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{asset.label}</p>
                <p className={`mt-1 text-xs ${selected ? "text-slate-200" : "text-slate-500"}`}>
                  {asset.isPrimary ? "Primary logo" : "Saved logo"}
                </p>
              </div>
              {asset.isPrimary ? (
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                    selected ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  Primary
                </span>
              ) : null}
            </div>
            <div
              className={`mt-3 flex h-20 items-center justify-center overflow-hidden rounded-lg border ${
                selected ? "border-white/20 bg-white/10" : "border-slate-200 bg-slate-50"
              }`}
            >
              <img
                src={asset.imageDataUrl}
                alt={asset.label}
                className="max-h-14 max-w-[80%] object-contain"
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
