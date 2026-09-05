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
        "overflow-hidden border-slate-200 bg-white",
        className,
      )}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2.5">
          <p
            className={cn(
              "admin-kicker",
              inverted ? "text-slate-300" : "text-slate-500",
            )}
          >
            {eyebrow}
          </p>
          <div className="space-y-2">
            <h1
              className={cn(
                "text-2xl font-bold tracking-tight sm:text-[1.875rem]",
                inverted ? "text-white" : "text-slate-950",
              )}
            >
              {title}
            </h1>
            {description ? (
              <p
                className={cn(
                  "max-w-3xl text-sm leading-6",
                  inverted ? "text-slate-300" : "text-slate-600",
                )}
              >
                {description}
              </p>
            ) : null}
          </div>
          {chips ? <div className="flex flex-wrap gap-2">{chips}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2 lg:justify-end">{actions}</div> : null}
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
    cyan: "border-slate-200 bg-slate-50 text-slate-900",
    amber: "border-amber-200 bg-amber-50/70 text-amber-950",
    emerald: "border-emerald-200 bg-emerald-50/70 text-emerald-950",
    violet: "border-violet-200 bg-violet-50/70 text-violet-950",
  } as const;

  return (
    <div className={cn("rounded-lg border px-3 py-2", toneClassMap[tone])}>
      <p className="admin-kicker opacity-65">{label}</p>
      <p className="mt-1 text-lg font-bold tracking-tight">{value}</p>
    </div>
  );
}
