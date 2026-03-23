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
    <div className="hover-lift rounded-xl border border-slate-200 bg-white/95 p-4">
      <div className="flex items-center gap-2">
        <span className="app-icon-chip">
          <Icon className="h-4 w-4 text-slate-700" />
        </span>
        <h3 className="text-sm font-semibold text-slate-600">{label}</h3>
      </div>
      <p className="mt-3 break-words text-2xl font-semibold text-slate-900">{value}</p>
      <div className="mt-3 h-1.5 rounded-full bg-[linear-gradient(90deg,#c7d2fe_0%,#93c5fd_45%,#fde68a_100%)]" />
    </div>
  );
}

export function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function QuickPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
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
