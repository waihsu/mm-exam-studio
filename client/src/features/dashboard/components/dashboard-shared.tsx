import type { ComponentType } from "react";

export function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.36)]">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-slate-500">{label}</h3>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-5 break-words text-3xl font-extrabold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

export function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[#e2dfd6] py-3 last:border-b-0">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>
      <p className="text-right text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

export function QuickPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#dfdcd2] bg-[#fffefa] px-3 py-2">
      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function BadgePill({ label, value }: { label: string; value: string }) {
  return (
    <span className="app-chip">
      {label}: {value}
    </span>
  );
}
