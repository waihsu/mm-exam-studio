import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Copy, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getQuestionTypeLabel } from "./question-form.constants";
import type { QuestionRecord } from "../types/question.type";

type QuestionTableProps = {
  questions: QuestionRecord[];
  isLoading?: boolean;
  publishingQuestionId?: string | null;
  duplicatingQuestionId?: string | null;
  deletingQuestionId?: string | null;
  onTogglePublish: (question: QuestionRecord) => Promise<void>;
  onDuplicate: (question: QuestionRecord) => Promise<void>;
  onDelete: (question: QuestionRecord) => Promise<void>;
};

const difficultyVariantMap = {
  easy: "secondary",
  medium: "outline",
  hard: "destructive",
} as const;

export function QuestionTable({
  questions,
  isLoading = false,
  publishingQuestionId = null,
  duplicatingQuestionId = null,
  deletingQuestionId = null,
  onTogglePublish,
  onDuplicate,
  onDelete,
}: QuestionTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<QuestionRecord | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/80">
        <Spinner className="mr-2 h-4 w-4" />
        <span className="text-sm text-slate-600">Loading questions...</span>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-10 text-center text-sm text-slate-600">
        No questions matched the current filters yet.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-[0_10px_28px_-24px_rgba(15,23,42,0.42)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Code</TableHead>
              <TableHead>Question</TableHead>
              <TableHead className="w-[210px]">Taxonomy</TableHead>
              <TableHead className="w-[120px]">Type</TableHead>
              <TableHead className="w-[120px]">Difficulty</TableHead>
              <TableHead className="w-[130px]">Status</TableHead>
              <TableHead className="w-[76px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.map((question) => {
              const isPublishing = publishingQuestionId === question.id;
              const isDuplicating = duplicatingQuestionId === question.id;
              const isDeleting = deletingQuestionId === question.id;

              return (
                <TableRow key={question.id}>
                  <TableCell className="font-mono text-xs font-semibold text-slate-700">
                    {question.questionCode}
                  </TableCell>
                  <TableCell className="max-w-xl whitespace-normal">
                    <div className="space-y-1">
                      <p className="line-clamp-2 font-medium text-slate-900">
                        {question.body}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={question.mode === "variable" ? "secondary" : "outline"}
                          className="capitalize"
                        >
                          {question.mode}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {question.reviewStatus.replace("_", " ")}
                        </Badge>
                        {question.mode === "variable" &&
                        (question.variablesSchema?.length ?? 0) > 0 ? (
                          <Badge variant="outline">
                            {question.variablesSchema?.length} variable(s)
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-slate-500">
                        {question.options.length} option(s) • {question.marks} mark(s)
                      </p>
                      {question.creator ? (
                        <p className="text-xs text-slate-500">
                          Author: {question.creator.name || question.creator.email}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="space-y-1 text-xs text-slate-600">
                      <p>{question.grade.name}</p>
                      <p>{question.subject.name}</p>
                      {question.chapter ? <p>{question.chapter.name}</p> : null}
                      {question.subChapter ? <p>{question.subChapter.name}</p> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {getQuestionTypeLabel(question.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={difficultyVariantMap[question.difficulty]}
                      className="capitalize"
                    >
                      {question.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={question.isPublished}
                        disabled={isPublishing || isDeleting}
                        onCheckedChange={() => {
                          void onTogglePublish(question);
                        }}
                        aria-label={question.isPublished ? "Move to draft" : "Publish question"}
                      />
                      <span className="text-xs font-medium text-slate-600">
                        {isPublishing
                          ? "Saving"
                          : question.isPublished
                            ? "Live"
                            : "Draft"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-slate-300 bg-white"
                            disabled={isDeleting || isPublishing}
                            aria-label={`Open actions for ${question.questionCode}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 border-slate-200 bg-white/95"
                        >
                          <DropdownMenuItem asChild>
                            <Link
                              to="/questions/$questionId"
                              params={{ questionId: question.id }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Review
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              to="/questions/$questionId/edit"
                              params={{ questionId: question.id }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={isDuplicating || isDeleting || isPublishing}
                            onSelect={() => {
                              void onDuplicate(question);
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            {isDuplicating ? "Duplicating..." : "Duplicate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={isDeleting || isPublishing}
                            onSelect={(event) => {
                              event.preventDefault();
                              setDeleteTarget(question);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isDeleting ? "Deleting..." : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this question?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  This will remove <strong>{deleteTarget.questionCode}</strong> from
                  the question bank. This action cannot be undone.
                </>
              ) : (
                "This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                if (!deleteTarget) {
                  return;
                }
                void onDelete(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              Delete question
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
