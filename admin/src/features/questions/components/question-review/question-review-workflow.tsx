import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PagePanel } from "@/components/page-container";
import type { QuestionReviewStatus } from "../../types/question.type";

type ReviewStatusOption = {
  value: QuestionReviewStatus;
  label: string;
  description: string;
};

type QuestionReviewWorkflowProps = {
  reviewStatus: QuestionReviewStatus;
  reviewNotes: string;
  options: ReviewStatusOption[];
  isSaving: boolean;
  onReviewStatusChange: (value: QuestionReviewStatus) => void;
  onReviewNotesChange: (value: string) => void;
  onSave: () => void;
};

export function QuestionReviewWorkflow({
  reviewStatus,
  reviewNotes,
  options,
  isSaving,
  onReviewStatusChange,
  onReviewNotesChange,
  onSave,
}: QuestionReviewWorkflowProps) {
  const selectedStatus = options.find((option) => option.value === reviewStatus) ?? options[0];
  return (
    <PagePanel className="space-y-4 bg-white/92">
      <div className="flex items-center gap-2">
        <Pencil className="h-4 w-4 text-slate-500" />
        <h3 className="text-lg font-bold text-slate-900">Review workflow</h3>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Review status</Label>
          <Select value={reviewStatus} onValueChange={onReviewStatusChange}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-slate-600">{selectedStatus.description}</p>
          {reviewStatus === "approved" ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm leading-5 text-emerald-800">
              Save this approval first. The Publish control will then unlock after
              the rendered question has been reviewed.
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="review-notes">Reviewer notes</Label>
          <Textarea
            id="review-notes"
            value={reviewNotes}
            onChange={(event) => onReviewNotesChange(event.target.value)}
            placeholder="Leave notes for authors or reviewers here."
            className="min-h-28 bg-white"
          />
          <p className="text-xs leading-5 text-slate-500">
            Notes are especially useful when marking a question as needs changes.
          </p>
        </div>

        <Button type="button" className="w-full" disabled={isSaving} onClick={onSave}>
          {isSaving ? "Saving review..." : "Save review state"}
        </Button>
      </div>
    </PagePanel>
  );
}
