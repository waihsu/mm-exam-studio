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
        "overflow-hidden border-[#d8d4c9] bg-[#fffdf8]",
        inverted && "border-[#202321] bg-[#202321] shadow-[0_24px_60px_-40px_rgba(32,35,33,0.7)]",
        className,
      )}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2.5">
          <p
            className={cn(
              "admin-kicker",
              inverted ? "text-[#d8d4c9]" : "text-[#48766b]",
            )}
          >
            {eyebrow}
          </p>
          <div className="space-y-2">
            <h1
              className={cn(
                "text-2xl font-bold tracking-tight sm:text-[1.875rem]",
                inverted ? "text-[#fffdf8]" : "text-[#202321]",
              )}
            >
              {title}
            </h1>
            {description ? (
              <p
                className={cn(
                  "max-w-3xl text-sm leading-6",
                  inverted ? "text-[#d8d4c9]" : "text-[#6e706b]",
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
    default: "border-[#d8d4c9] bg-[#fffdf8] text-[#202321]",
    cyan: "border-[#c9dcd3] bg-[#e7efe9] text-[#2b554d]",
    amber: "border-[#ead1c3] bg-[#f5e4da] text-[#8f4437]",
    emerald: "border-[#c9dcd3] bg-[#e7efe9] text-[#2b554d]",
    violet: "border-[#dcd6f4] bg-[#eeeafb] text-[#7668b6]",
  } as const;

  return (
    <div className={cn("rounded-xl border px-3 py-2.5", toneClassMap[tone])}>
      <p className="admin-kicker opacity-65">{label}</p>
      <p className="mt-1 text-lg font-bold tracking-tight">{value}</p>
    </div>
  );
}
