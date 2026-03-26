import type { Dispatch, SetStateAction } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PagePanel } from "@/components/page-container";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  FileWarning,
  Eye,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";
import type {
  GeneratedPaperSummary,
  PaperBlueprintDetail,
  PaperBlueprintPreviewIssue,
  PaperBlueprintPreviewSummary,
  WorkspacePaperStatus,
} from "../types";
import {
  blueprintIssueTone,
  blueprintModeLabel,
  formatBlueprintDateTime,
} from "../utils/blueprint-display";

export type BlueprintMaterializeDraft = {
  title: string;
  schoolName: string;
  academicYear: string;
  instructions: string;
};

function PreviewMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className={cn("rounded-2xl border px-4 py-3", tone)}>
      <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

type BlueprintPreviewContentProps = {
  detail: PaperBlueprintDetail;
  preview: PaperBlueprintPreviewSummary;
  materializeDraft: BlueprintMaterializeDraft;
  onMaterializeDraftChange: Dispatch<SetStateAction<BlueprintMaterializeDraft>>;
  onMaterialize: () => void;
  materializing: boolean;
  onOpenPaperDetail: (paperId: string) => void;
  onTogglePaperStatus: (paperId: string, status: WorkspacePaperStatus) => void;
  onDeletePaper: (paper: GeneratedPaperSummary) => void;
  statusUpdatingPaperId: string | null;
  deletingPaperId: string | null;
  paperStatusUpdating: boolean;
  paperDeleting: boolean;
};

const issueTone = (issue: PaperBlueprintPreviewIssue) => blueprintIssueTone(issue);

export function BlueprintPreviewContent({
  detail,
  preview,
  materializeDraft,
  onMaterializeDraftChange,
  onMaterialize,
  materializing,
  onOpenPaperDetail,
  onTogglePaperStatus,
  onDeletePaper,
  statusUpdatingPaperId,
  deletingPaperId,
  paperStatusUpdating,
  paperDeleting,
}: BlueprintPreviewContentProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <PreviewMetric
          label="Readiness"
          value={preview.readyToMaterialize ? "Ready" : "Needs fixes"}
          tone={
            preview.readyToMaterialize
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }
        />
        <PreviewMetric
          label="Reserved questions"
          value={String(preview.reservedQuestionCount)}
          tone="border-slate-200 bg-slate-50 text-slate-900"
        />
        <PreviewMetric
          label="Issues"
          value={String(preview.issueCount)}
          tone={
            preview.issueCount > 0
              ? "border-rose-200 bg-rose-50 text-rose-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }
        />
        <PreviewMetric
          label="Outputs"
          value={detail.includeAnswerPaper ? "Question + answer" : "Question only"}
          tone="border-sky-200 bg-sky-50 text-sky-900"
        />
      </div>

      <PagePanel className="bg-slate-50/80">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {blueprintModeLabel[detail.mode]} blueprint
            </p>
            <h3 className="text-xl font-black tracking-tight text-slate-900">
              {detail.title}
            </h3>
            <p className="text-sm text-slate-600">
              {detail.grade.name} • {detail.subject.name} • {detail.totalMarks} marks
            </p>
          </div>
          <div className="space-y-1 text-sm text-slate-600 xl:text-right">
            <p>Updated {formatBlueprintDateTime(detail.updatedAt)}</p>
            <p>{detail.generatedPaperCount} generated papers on record</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {(
            Object.entries(detail.difficultyDistribution) as Array<
              [keyof PaperBlueprintDetail["difficultyDistribution"], number]
            >
          ).map(([bucket, value]) => (
            <div
              key={bucket}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                {bucket}
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">{value}%</p>
            </div>
          ))}
        </div>
      </PagePanel>

      {preview.issues.length > 0 ? (
        <PagePanel className="space-y-3 bg-white/92">
          <div className="flex items-center gap-2">
            <FileWarning className="h-4 w-4 text-amber-700" />
            <h4 className="text-lg font-bold tracking-tight text-slate-900">
              Issues to fix
            </h4>
          </div>
          <div className="space-y-2">
            {preview.issues.map((issue, index) => (
              <div
                key={`${issue.code}-${issue.slotNumber ?? "none"}-${index}`}
                className={cn("rounded-2xl border px-4 py-3 text-sm", issueTone(issue))}
              >
                <p className="font-semibold">{issue.message}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] opacity-75">
                  {issue.code}
                  {issue.sectionCode ? ` • section ${issue.sectionCode}` : ""}
                  {typeof issue.slotNumber === "number"
                    ? ` • slot ${issue.slotNumber}`
                    : ""}
                </p>
              </div>
            ))}
          </div>
        </PagePanel>
      ) : (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertTitle>Preview looks clean</AlertTitle>
          <AlertDescription>
            The server dry run found enough questions for the current structure.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <PagePanel className="space-y-3 bg-white/92">
          <h4 className="text-lg font-bold tracking-tight text-slate-900">Sections</h4>
          <div className="space-y-3">
            {preview.sections.length === 0 ? (
              <p className="text-sm text-slate-500">
                No section summary for this blueprint yet.
              </p>
            ) : (
              preview.sections.map((section) => (
                <div
                  key={section.code}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{section.code}</p>
                    {section.questionType ? (
                      <Badge
                        variant="outline"
                        className="border-slate-200 bg-white text-slate-700"
                      >
                        {section.questionType}
                      </Badge>
                    ) : null}
                    <Badge
                      variant="outline"
                      className={cn(
                        "bg-white",
                        section.enough
                          ? "border-emerald-200 text-emerald-700"
                          : "border-rose-200 text-rose-700",
                      )}
                    >
                      {section.matchedCount}/{section.requestedCount}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {section.title ?? "Untitled section"} •{" "}
                    {section.marksPerQuestion ?? "-"} marks each
                  </p>
                  {section.buckets.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {section.buckets.map((bucket) => (
                        <Badge
                          key={`${section.code}-${bucket.difficulty}`}
                          variant="outline"
                          className="border-slate-200 bg-white text-slate-700"
                        >
                          {bucket.difficulty}: {bucket.matchedCount}/{bucket.requiredCount}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </PagePanel>

        <PagePanel className="space-y-3 bg-white/92">
          <h4 className="text-lg font-bold tracking-tight text-slate-900">Slots</h4>
          <div className="space-y-3">
            {preview.slots.length === 0 ? (
              <p className="text-sm text-slate-500">
                This mode does not expose slot-level preview output.
              </p>
            ) : (
              preview.slots.map((slot) => (
                <div
                  key={`${slot.sectionCode ?? "slot"}-${slot.slotNumber}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">
                      Slot {slot.slotNumber}
                    </p>
                    {slot.sectionCode ? (
                      <Badge
                        variant="outline"
                        className="border-slate-200 bg-white text-slate-700"
                      >
                        {slot.sectionCode}
                      </Badge>
                    ) : null}
                    <Badge
                      variant="outline"
                      className={cn(
                        "bg-white",
                        slot.enough
                          ? "border-emerald-200 text-emerald-700"
                          : "border-rose-200 text-rose-700",
                      )}
                    >
                      {slot.matchedCount}/1
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {slot.questionType} • {slot.marks} marks
                    {slot.difficultyTarget ? ` • ${slot.difficultyTarget}` : ""}
                  </p>
                  {slot.lockedQuestionId ? (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Locked question attached
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </PagePanel>
      </div>

      <PagePanel className="space-y-3 bg-white/92">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-lg font-bold tracking-tight text-slate-900">
            Generated papers
          </h4>
          <p className="text-xs text-slate-500">
            Manage draft/final status and inspect generated question sets.
          </p>
        </div>

        {detail.generatedPapers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
            No generated paper records yet.
          </div>
        ) : (
          <div className="space-y-3">
            {detail.generatedPapers.map((paper) => {
              const nextStatus: WorkspacePaperStatus =
                paper.status === "draft" ? "finalized" : "draft";
              const isUpdatingStatus =
                statusUpdatingPaperId === paper.id && paperStatusUpdating;
              const isDeleting = deletingPaperId === paper.id && paperDeleting;
              return (
                <div
                  key={paper.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{paper.title}</p>
                        <Badge
                          variant="outline"
                          className={cn(
                            paper.status === "finalized"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-white text-slate-700",
                          )}
                        >
                          {paper.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        {paper.totalQuestions} questions • {paper.totalMarks} marks
                      </p>
                      <p className="text-xs text-slate-500">
                        Updated {formatBlueprintDateTime(paper.updatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-slate-300/80 bg-white"
                        onClick={() => onOpenPaperDetail(paper.id)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View details
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-slate-300/80 bg-white"
                        disabled={paperStatusUpdating}
                        onClick={() => onTogglePaperStatus(paper.id, nextStatus)}
                      >
                        {isUpdatingStatus ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {paper.status === "draft" ? "Finalize" : "Move to draft"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                        disabled={paperDeleting}
                        onClick={() => onDeletePaper(paper)}
                      >
                        {isDeleting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PagePanel>

      <PagePanel className="space-y-4 bg-white/92">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <h4 className="text-lg font-bold tracking-tight text-slate-900">
              Generate paper from this blueprint
            </h4>
            <p className="text-sm text-slate-600">
              This calls the backend materialize endpoint and creates a question
              paper record immediately.
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              preview.readyToMaterialize
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700",
            )}
          >
            {preview.readyToMaterialize ? "Ready to generate" : "Fix issues first"}
          </Badge>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="materialize-title">Paper title</Label>
            <Input
              id="materialize-title"
              value={materializeDraft.title}
              onChange={(event) =>
                onMaterializeDraftChange((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Midterm Test Paper A"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="materialize-school-name">School name</Label>
              <Input
                id="materialize-school-name"
                value={materializeDraft.schoolName}
                onChange={(event) =>
                  onMaterializeDraftChange((current) => ({
                    ...current,
                    schoolName: event.target.value,
                  }))
                }
                placeholder="MM Exam Studio"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="materialize-academic-year">Academic year</Label>
              <Input
                id="materialize-academic-year"
                value={materializeDraft.academicYear}
                onChange={(event) =>
                  onMaterializeDraftChange((current) => ({
                    ...current,
                    academicYear: event.target.value,
                  }))
                }
                placeholder="2026"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="materialize-instructions">Instructions</Label>
          <Textarea
            id="materialize-instructions"
            className="min-h-28"
            value={materializeDraft.instructions}
            onChange={(event) =>
              onMaterializeDraftChange((current) => ({
                ...current,
                instructions: event.target.value,
              }))
            }
            placeholder="Answer all questions. Show working where necessary."
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            onClick={onMaterialize}
            disabled={!preview.readyToMaterialize || materializing}
          >
            {materializing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate paper"
            )}
          </Button>
        </div>
      </PagePanel>
    </div>
  );
}
