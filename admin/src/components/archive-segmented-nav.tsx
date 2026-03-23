import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type ArchiveSegmentedNavItem = {
  to: string;
  label: string;
  caption: string;
  active: boolean;
};

type ArchiveSegmentedNavProps = {
  badge?: string;
  title: string;
  description: string;
  items: [ArchiveSegmentedNavItem, ArchiveSegmentedNavItem];
};

export function ArchiveSegmentedNav({
  badge,
  title,
  description,
  items,
}: ArchiveSegmentedNavProps) {
  const currentItem = items.find((item) => item.active) ?? items[0];
  const linkItem = items.find((item) => !item.active) ?? items[1];

  return (
    <div className="rounded-2xl border border-white/80 bg-white/88 p-4 shadow-[0_16px_34px_-26px_rgba(15,23,42,0.45)] ring-1 ring-slate-900/5 backdrop-blur-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          {badge ? (
            <p className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
              {badge}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black tracking-tight text-slate-950">{title}</h2>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 ring-1 ring-emerald-100">
              {currentItem.label}
            </span>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <div className="flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50/85 px-4 py-3 sm:min-w-[260px]">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
            Jump To
          </p>
          <p className="text-sm text-slate-600">{linkItem.caption}</p>
          <Link
            to={linkItem.to}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] transition-colors",
              "border-indigo-200 bg-white text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50",
            )}
          >
            Open {linkItem.label}
          </Link>
        </div>
      </div>
    </div>
  );
}
