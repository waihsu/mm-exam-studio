import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PagePanel } from "@/components/page-container";
import { AlertCircle, Loader2 } from "lucide-react";
import type { WorkspacePaperDetail } from "../types";
import {
  formatBlueprintDateTime,
  toPlainBlueprintPreview,
} from "../utils/blueprint-display";
import { cn } from "@/lib/utils";

type GeneratedPaperDetailDialogProps = {
  paperId: string | null;
  paper: WorkspacePaperDetail | undefined;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GeneratedPaperDetailDialog({
  paperId,
  paper,
  loading,
  onOpenChange,
}: GeneratedPaperDetailDialogProps) {
  return (
    <Dialog open={Boolean(paperId)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generated paper details</DialogTitle>
          <DialogDescription>
            Review the generated question set and swap counters before export.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading paper details...
          </div>
        ) : paper ? (
          <div className="space-y-4">
            <PagePanel className="bg-slate-50/80">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="text-lg font-bold tracking-tight text-slate-900">
                    {paper.title}
                  </h4>
                  <p className="text-sm text-slate-600">
                    {paper.totalQuestions} questions • {paper.totalMarks} marks
                  </p>
                </div>
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
              <p className="text-xs text-slate-500">
                Updated {formatBlueprintDateTime(paper.updatedAt)}
              </p>
            </PagePanel>

            <PagePanel className="space-y-3 bg-white/92">
              <h4 className="text-lg font-bold tracking-tight text-slate-900">Question items</h4>
              <div className="space-y-2">
                {paper.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">
                        #{item.position} {item.questionCode}
                      </p>
                      <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                        {item.questionType}
                      </Badge>
                      <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                        {item.marks} marks
                      </Badge>
                      <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                        swaps {item.swapCount}/{item.swapLimit}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {toPlainBlueprintPreview(item.body, 220)}
                    </p>
                  </div>
                ))}
              </div>
            </PagePanel>
          </div>
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Paper detail not available</AlertTitle>
            <AlertDescription>This generated paper could not be loaded.</AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
