import { BookOpenCheck } from "lucide-react";
import type { SubscriptionRequestRecord } from "@/features/workspace/types";

export function UsageCard({
  icon: Icon,
  label,
  value,
  note,
  tone,
}: {
  icon: typeof BookOpenCheck;
  label: string;
  value: number;
  note: string;
  tone: "emerald" | "sky" | "amber" | "slate";
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-200"
      : tone === "sky"
        ? "border-sky-200"
        : tone === "amber"
          ? "border-amber-200"
          : "border-slate-200";

  return (
    <div className={`rounded-xl border bg-white/95 p-4 ${toneClass}`}>
      <div className="flex items-center gap-2">
        <span className="app-icon-chip">
          <Icon className="h-4 w-4 text-slate-700" />
        </span>
        <h3 className="font-semibold text-slate-900">{label}</h3>
      </div>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{note}</p>
    </div>
  );
}

export function RequestStatusPill({ status }: { status: SubscriptionRequestRecord["status"] }) {
  const toneClass =
    status === "approved"
      ? "bg-emerald-100 text-emerald-800"
      : status === "pending"
        ? "bg-amber-100 text-amber-800"
        : status === "rejected"
          ? "bg-rose-100 text-rose-800"
          : "bg-slate-200 text-slate-700";

  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${toneClass}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export function UsagePill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-slate-900">{value}</p>
    </div>
  );
}
