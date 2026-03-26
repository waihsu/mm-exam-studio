import { Edit3, Eye, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GeneratedPaperSummary, PaperBlueprintListRow } from "../types";
import {
  blueprintModeLabel,
  blueprintStatusLabel,
  blueprintStatusTone,
  formatBlueprintDateTime,
} from "../utils/blueprint-display";

function GeneratedPaperPreview({ paper }: { paper: GeneratedPaperSummary | null }) {
  if (!paper) {
    return <span className="text-sm text-slate-500">No paper generated yet</span>;
  }

  return (
    <div className="space-y-1 text-sm text-slate-600">
      <p className="font-semibold text-slate-900">{paper.title}</p>
      <p>
        {paper.totalQuestions} questions • {paper.totalMarks} marks
      </p>
      <p>Updated {formatBlueprintDateTime(paper.updatedAt)}</p>
    </div>
  );
}

type BlueprintRowProps = {
  row: PaperBlueprintListRow;
  onPreview: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
};

export function BlueprintRow({
  row,
  onPreview,
  onEdit,
  onDelete,
  deleting,
}: BlueprintRowProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold tracking-tight text-slate-900">
              {row.title}
            </h3>
            <Badge variant="outline" className={blueprintStatusTone[row.status]}>
              {blueprintStatusLabel[row.status]}
            </Badge>
            <Badge
              variant="outline"
              className="border-slate-200 bg-slate-50 text-slate-700"
            >
              {blueprintModeLabel[row.mode]}
            </Badge>
            {row.templateConfig.isPublished ? (
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-emerald-700"
              >
                Template: {row.templateConfig.availablePlanCodes.join(", ")}
              </Badge>
            ) : null}
            {row.includeAnswerPaper ? (
              <Badge
                variant="outline"
                className="border-sky-200 bg-sky-50 text-sky-700"
              >
                Answer paper
              </Badge>
            ) : null}
          </div>

          <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Owner
              </p>
              <p className="font-medium text-slate-900">
                {row.owner?.name ?? "Unknown owner"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {row.owner?.email ?? ""}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Curriculum
              </p>
              <p className="font-medium text-slate-900">
                {row.grade.name} • {row.subject.name}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Structure
              </p>
              <p className="font-medium text-slate-900">
                {row.sectionCount} sections • {row.slotCount} slots
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Marks
              </p>
              <p className="font-medium text-slate-900">{row.totalMarks} total</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Generated
              </p>
              <p className="font-medium text-slate-900">{row.generatedPaperCount} papers</p>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 xl:max-w-sm xl:items-end">
          <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Latest generated paper
            </p>
            <GeneratedPaperPreview paper={row.latestGeneratedPaper} />
          </div>

          <div className="flex w-full flex-col gap-2 xl:w-auto">
            <Button onClick={onPreview} className="w-full xl:w-auto">
              <Eye className="mr-2 h-4 w-4" />
              Preview summary
            </Button>
            <div className="flex gap-2">
              <Button onClick={onEdit} variant="outline" className="flex-1 xl:flex-none">
                <Edit3 className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                onClick={onDelete}
                variant="outline"
                className="flex-1 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 xl:flex-none"
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

