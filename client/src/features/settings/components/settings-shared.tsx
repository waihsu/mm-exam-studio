import { Notice } from "@/components/ui/notice";

export function ChecklistRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <Notice tone={ok ? "success" : "warning"} className="flex items-center justify-between">
      <p className="text-sm font-medium">{label}</p>
      <span className="text-xs font-bold uppercase tracking-[0.16em]">
        {ok ? "ok" : "check"}
      </span>
    </Notice>
  );
}

export function InfoCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
      <p className="field-label">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{note}</p>
    </div>
  );
}
