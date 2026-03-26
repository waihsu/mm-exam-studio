import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PagePanel } from "@/components/page-container";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
  chips,
  className,
  inverted = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  chips?: ReactNode;
  className?: string;
  inverted?: boolean;
}) {
  return (
    <PagePanel
      className={cn(
        "overflow-hidden bg-[linear-gradient(125deg,rgba(255,255,255,0.98)_0%,rgba(241,245,249,0.9)_55%,rgba(224,242,254,0.55)_100%)]",
        className,
      )}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p
            className={cn(
              "text-xs font-bold uppercase tracking-[0.22em]",
              inverted ? "text-cyan-100/80" : "text-slate-500",
            )}
          >
            {eyebrow}
          </p>
          <div className="space-y-2">
            <h1
              className={cn(
                "text-2xl font-black tracking-tight sm:text-3xl",
                inverted ? "text-white" : "text-slate-900",
              )}
            >
              {title}
            </h1>
            {description ? (
              <p
                className={cn(
                  "max-w-3xl text-sm leading-7",
                  inverted ? "text-slate-300" : "text-slate-600",
                )}
              >
                {description}
              </p>
            ) : null}
          </div>
          {chips ? <div className="flex flex-wrap gap-2">{chips}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </PagePanel>
  );
}

export function AdminStatPill({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "cyan" | "amber" | "emerald" | "violet";
}) {
  const toneClassMap = {
    default: "border-slate-200 bg-white text-slate-900",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    violet: "border-violet-200 bg-violet-50 text-violet-900",
  } as const;

  return (
    <div className={cn("rounded-2xl border px-3 py-2 shadow-sm", toneClassMap[tone])}>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-1 text-lg font-black tracking-tight">{value}</p>
    </div>
  );
}
