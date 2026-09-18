import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { QuestionRecord } from "@/features/questions/types/question.type";
import type { PaperBlueprintSlotInput } from "../types";
import { toPlainBlueprintPreview } from "../utils/blueprint-display";

type LockedQuestionPickerDialogProps = {
  open: boolean;
  slot: PaperBlueprintSlotInput | undefined;
  availableLessonCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  loading: boolean;
  candidates: QuestionRecord[] | undefined;
  onOpenChange: (open: boolean) => void;
  onChooseQuestion: (question: QuestionRecord) => void;
};

export function LockedQuestionPickerDialog({
  open,
  slot,
  availableLessonCount,
  search,
  onSearchChange,
  loading,
  candidates,
  onOpenChange,
  onChooseQuestion,
}: LockedQuestionPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pick locked question</DialogTitle>
          <DialogDescription>
            Match this slot with an existing published question instead of entering ID manually.
          </DialogDescription>
        </DialogHeader>

        {slot ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Slot {slot.slotNumber}</p>
              <p className="mt-1">
                {slot.questionType} • {slot.marks} marks
                {slot.chapterId ? " • chapter filtered" : ""}
                {slot.subChapterId ? " • lesson filtered" : ""}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Available lessons: {availableLessonCount}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locked-question-search-page">Search question body or code</Label>
              <Input
                id="locked-question-search-page"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="e.g. derivative, G12-MATH-..."
              />
            </div>

            {loading ? (
              <div className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching published questions...
              </div>
            ) : (candidates?.length ?? 0) === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                No matching published questions found for this slot.
              </div>
            ) : (
              <div className="space-y-2">
                {candidates?.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{candidate.questionCode}</p>
                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                          {candidate.type}
                        </Badge>
                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                          {candidate.marks} marks
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        {toPlainBlueprintPreview(candidate.body || "No preview available")}
                      </p>
                    </div>
                    <Button type="button" onClick={() => onChooseQuestion(candidate)}>
                      Use question
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
