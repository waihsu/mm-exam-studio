import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type BlueprintSummaryCardProps = {
  label: string;
  value: number;
  tone: string;
  icon: LucideIcon;
};

export function BlueprintSummaryCard({
  label,
  value,
  tone,
  icon: Icon,
}: BlueprintSummaryCardProps) {
  return (
    <div className={cn("rounded-2xl border p-5", tone)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">
            {label}
          </p>
          <p className="text-3xl font-black tracking-tight">{value}</p>
        </div>
        <div className="rounded-2xl border border-current/10 bg-white/60 p-3">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

