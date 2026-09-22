import { Link } from "@tanstack/react-router";
import { Copy, Pencil, RefreshCcw, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { QuestionRecord } from "../../types/question.type";

type QuestionReviewActionsProps = {
  question: QuestionRecord;
  isPublishing: boolean;
  isDuplicating: boolean;
  isDeleting: boolean;
  isRefreshing: boolean;
  onTogglePublish: () => void;
  onDuplicate: () => void;
  onRefresh: () => void;
  onDelete: () => void;
};

export function QuestionReviewActions(props: QuestionReviewActionsProps) {
  const {
    question,
    isPublishing,
    isDuplicating,
    isDeleting,
    isRefreshing,
    onTogglePublish,
    onDuplicate,
    onRefresh,
    onDelete,
  } = props;
  const busy = isDuplicating || isDeleting;
  const canPublish = question.reviewStatus === "approved";
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 xl:sticky xl:top-24 xl:w-[340px]">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-900">Publish status</p>
        <p className="text-sm text-slate-600">
          {question.isPublished
            ? "This question is visible in the published bank."
            : canPublish
              ? "This question is approved and ready to enter the published bank."
              : "Approve the rendered question in Review workflow before publishing."}
        </p>
      </div>
      <div className="flex items-center justify-between rounded-xl border border-white/80 bg-white/90 px-4 py-3">
        <span className="text-sm font-medium text-slate-700">
          {isPublishing
            ? "Saving..."
            : question.isPublished
              ? "Published"
              : canPublish
                ? "Approved — ready"
                : "Awaiting approval"}
        </span>
        <Switch
          checked={question.isPublished}
          disabled={isPublishing || (!question.isPublished && !canPublish)}
          onCheckedChange={onTogglePublish}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button asChild className="w-full sm:col-span-2">
          <Link to="/questions/$questionId/edit" params={{ questionId: question.id }}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit question
          </Link>
        </Button>
        <Button type="button" variant="outline" className="w-full border-slate-300/80 bg-white" disabled={busy} onClick={onDuplicate}>
          <Copy className="mr-2 h-4 w-4" />
          {isDuplicating ? "Duplicating..." : "Duplicate"}
        </Button>
        <Button type="button" variant="outline" className="w-full border-slate-300/80 bg-white" disabled={isRefreshing || busy} onClick={onRefresh}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh samples
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" className="w-full border-red-200 bg-white text-red-600 hover:text-red-700 sm:col-span-2" disabled={busy}>
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this question?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove <strong>{question.questionCode}</strong> from the question bank. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={onDelete}>
                Delete question
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
