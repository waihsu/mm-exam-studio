export function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function SessionStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
