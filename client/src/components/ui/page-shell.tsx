import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  chips,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  chips?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-[0_18px_45px_-38px_rgba(15,23,42,0.34)] sm:px-7 sm:py-7">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_90%_0%,rgba(99,102,241,0.12),transparent_50%)]" />
      <div className="relative flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-3xl">
          <p className="ui-kicker text-indigo-700">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-[clamp(2rem,3.4vw,3rem)] font-bold leading-[1.06] tracking-[-0.045em] text-slate-950">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-[0.9375rem] leading-7 text-slate-600">{description}</p>
          ) : null}
          {chips ? <div className="mt-4 flex flex-wrap gap-2">{chips}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_-26px_rgba(21,27,43,0.26)]", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[1.0625rem] font-bold leading-6 text-slate-950">{title}</h2>
          {description ? <p className="mt-1.5 text-sm leading-6 text-slate-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function StatGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}>{children}</div>;
}
