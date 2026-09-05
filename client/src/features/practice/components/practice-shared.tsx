export function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/20 bg-white/[0.96] px-3 py-2.5">
      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-base font-bold text-slate-900">{value}</p>
    </div>
  );
}

export function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-[#e2dfd6] bg-[#f8f7f2] px-3 py-2.5">
      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function SessionStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#dfdcd2] bg-[#fffefa] px-3 py-3">
      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
