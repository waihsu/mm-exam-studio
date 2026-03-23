import { Notice } from "@/components/ui/notice";

export function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-base font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

export function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <Notice tone={ok ? "success" : "warning"} className="flex items-center justify-between">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em]">{ok ? "ok" : "check"}</p>
    </Notice>
  );
}

export function InlineError({ message }: { message: string }) {
  return (
    <Notice tone="error" className="mt-3">
      {message}
    </Notice>
  );
}
