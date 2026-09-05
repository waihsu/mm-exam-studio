import { CheckCircle2, FileWarning, Layers3, Loader2, Orbit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PagePanel } from "@/components/page-container";
import { BlueprintRow } from "./blueprint-row";
import { BlueprintSummaryCard } from "./blueprint-summary-card";
import type { PaperBlueprintListRow } from "../types";

type BlueprintListOverview = {
  total: number;
  readyCount: number;
  customCount: number;
  issueCandidateCount: number;
};

type BlueprintListContentProps = {
  rows: PaperBlueprintListRow[];
  overview: BlueprintListOverview;
  loading: boolean;
  deletingBlueprintId?: string;
  onCreate: () => void;
  onPreview: (blueprintId: string) => void;
  onEdit: (blueprintId: string) => void;
  onDelete: (row: PaperBlueprintListRow) => void;
};

export function BlueprintListContent({
  rows,
  overview,
  loading,
  deletingBlueprintId,
  onCreate,
  onPreview,
  onEdit,
  onDelete,
}: BlueprintListContentProps) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <BlueprintSummaryCard
          label="Total blueprints"
          value={overview.total}
          tone="border-slate-200 bg-white/90 text-slate-900"
          icon={Layers3}
        />
        <BlueprintSummaryCard
          label="Ready to materialize"
          value={overview.readyCount}
          tone="border-emerald-200 bg-emerald-50/80 text-emerald-950"
          icon={CheckCircle2}
        />
        <BlueprintSummaryCard
          label="Custom mode"
          value={overview.customCount}
          tone="border-sky-200 bg-sky-50/80 text-sky-950"
          icon={Orbit}
        />
        <BlueprintSummaryCard
          label="Needs setup"
          value={overview.issueCandidateCount}
          tone="border-amber-200 bg-amber-50/80 text-amber-950"
          icon={FileWarning}
        />
      </div>

      <PagePanel className="space-y-4 bg-white/88">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Exam engine
            </p>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Paper blueprints</h2>
            <p className="max-w-2xl text-sm text-slate-600">
              Build exam rules by mode (MCQ only, All type, Custom), then preview readiness
              before generating papers.
            </p>
          </div>
          <Button onClick={onCreate}>New blueprint</Button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading blueprint inventory...
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">
            No paper blueprints yet. Create your first blueprint to define section and slot rules.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <BlueprintRow
                key={row.id}
                row={row}
                onPreview={() => onPreview(row.id)}
                onEdit={() => onEdit(row.id)}
                onDelete={() => onDelete(row)}
                deleting={deletingBlueprintId === row.id}
              />
            ))}
          </div>
        )}
      </PagePanel>
    </>
  );
}
