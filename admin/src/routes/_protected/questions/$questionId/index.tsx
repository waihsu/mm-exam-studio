import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Copy,
  Eye,
  FlaskConical,
  Layers3,
  Pencil,
  RefreshCcw,
  Sigma,
  Trash2,
  UserRound,
} from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PagePanel } from "@/components/page-container";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { ADMIN_ROUTES } from "@/constants/routes";
import { questionApi } from "@/features/questions/api/question.api";
import { getQuestionTypeLabel } from "@/features/questions/components/question-form.constants";
import {
  MathTextPreview,
  preloadMathTextRenderer,
} from "@/features/questions/components/math-text-preview";
import type {
  QuestionPreview,
  QuestionRecord,
  QuestionReviewStatus,
} from "@/features/questions/types/question.type";

const VARIABLE_PREVIEW_SAMPLE_COUNT = 3;

export const Route = createFileRoute("/_protected/questions/$questionId/")({
  loader: async () => {
    await preloadMathTextRenderer();
  },
  component: QuestionReviewPage,
});

const difficultyToneMap = {
  easy: "secondary",
  medium: "outline",
  hard: "destructive",
} as const;

const reviewStatusOptions: Array<{
  value: QuestionReviewStatus;
  label: string;
  description: string;
}> = [
  {
    value: "draft",
    label: "Draft",
    description: "Still being written and not yet sent for review.",
  },
  {
    value: "in_review",
    label: "In Review",
    description: "Ready for reviewer attention but not approved yet.",
  },
  {
    value: "needs_changes",
    label: "Needs Changes",
    description: "Reviewer found issues and left follow-up notes.",
  },
  {
    value: "approved",
    label: "Approved",
    description: "Reviewed and cleared for publishing decisions.",
  },
];

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildPreviewRequests(question: QuestionRecord) {
  const count = question.mode === "variable" ? VARIABLE_PREVIEW_SAMPLE_COUNT : 1;

  return Array.from({ length: count }, () =>
    questionApi.previewQuestion({
      questionCode: question.questionCode,
      body: question.body,
      type: question.type,
      difficulty: question.difficulty,
      mode: question.mode,
      gradeId: question.grade.id,
      subjectId: question.subject.id,
      chapterId: question.chapter?.id ?? null,
      subChapterId: question.subChapter?.id ?? null,
      explanation: question.explanation ?? null,
      answerText: question.answerText ?? null,
      answerFormula: question.answerFormula ?? null,
      variablesSchema: question.variablesSchema ?? [],
      isPublished: question.isPublished,
      marks: question.marks,
      options: question.options.map((option) => ({
        label: option.label ?? undefined,
        text: option.text,
        isCorrect: option.isCorrect,
      })),
    }),
  );
}

function ReviewPreviewCard({
  preview,
  title,
}: {
  preview: QuestionPreview;
  title: string;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
          {title}
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(preview.context).length ? (
            Object.entries(preview.context).map(([key, value]) => (
              <Badge key={key} variant="outline">
                {key} = {String(value)}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-slate-500">No variables used.</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
          Body
        </p>
        <MathTextPreview content={preview.body} emptyLabel="No rendered body." />
      </div>

      {preview.options.length ? (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Options
          </p>
          <div className="space-y-2">
            {preview.options.map((option, index) => (
              <div
                key={`${option.label ?? "option"}-${index}`}
                className="rounded-xl border border-white/80 bg-white/90 px-3 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">
                    {option.label ?? String.fromCharCode(65 + index)}.
                  </span>
                  {option.isCorrect ? <Badge>Correct</Badge> : null}
                </div>
                <MathTextPreview
                  content={option.text}
                  emptyLabel="No option text."
                  className="mt-2"
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {preview.answerText ? (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Answer
          </p>
          <MathTextPreview content={preview.answerText} emptyLabel="No rendered answer." />
        </div>
      ) : null}

      {preview.explanation ? (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Explanation
          </p>
          <MathTextPreview
            content={preview.explanation}
            emptyLabel="No rendered explanation."
          />
        </div>
      ) : null}
    </div>
  );
}

function ReviewStatCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "slate" | "emerald" | "amber" | "sky";
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50/85"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50/85"
        : tone === "sky"
          ? "border-sky-200 bg-sky-50/85"
          : "border-slate-200 bg-white/90";

  return (
    <div className={`rounded-2xl border px-3 py-2 ${toneClass}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-base font-black text-slate-900">{value}</p>
    </div>
  );
}

function QuestionReviewPage() {
  const { questionId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const questionQuery = useQuery({
    queryKey: ["question", questionId],
    queryFn: async () => {
      const response = await questionApi.getQuestion(questionId);
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });

  const previewQuery = useQuery({
    queryKey: [
      "question-review-preview",
      questionId,
      questionQuery.data?.updatedAt,
      questionQuery.data?.isPublished,
    ],
    enabled: !!questionQuery.data,
    queryFn: async () => {
      if (!questionQuery.data) {
        return [];
      }

      const responses = await Promise.all(buildPreviewRequests(questionQuery.data));
      return responses.map((response) => {
        if (!response.ok) {
          throw new Error(response.message);
        }
        return response.data;
      });
    },
  });
  const [reviewStatus, setReviewStatus] = useState<QuestionReviewStatus>("draft");
  const [reviewNotes, setReviewNotes] = useState("");

  const publishMutation = useMutation({
    mutationFn: async (question: QuestionRecord) => {
      const nextIsPublished = !question.isPublished;
      const response = await questionApi.updateQuestion(question.id, {
        isPublished: nextIsPublished,
        ...(nextIsPublished ? { reviewStatus: "approved" as const } : {}),
      });
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: async (question) => {
      toast.success(
        question.isPublished ? "Question published" : "Question moved to draft",
      );
      await queryClient.invalidateQueries({ queryKey: ["questions"] });
      await queryClient.invalidateQueries({ queryKey: ["question", question.id] });
      await queryClient.invalidateQueries({
        queryKey: ["question-review-preview", question.id],
        exact: false,
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update question status",
      );
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (question: QuestionRecord) => {
      const response = await questionApi.duplicateQuestion(question.id);
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: async (question) => {
      toast.success(`Duplicated as ${question.questionCode}`);
      await queryClient.invalidateQueries({ queryKey: ["questions"] });
      await navigate({
        to: "/questions/$questionId/edit",
        params: { questionId: question.id },
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to duplicate question",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (question: QuestionRecord) => {
      const response = await questionApi.deleteQuestion(question.id);
      if (!response.ok) {
        throw new Error(response.message);
      }
      return question;
    },
    onSuccess: async (question) => {
      toast.success("Question deleted");
      await queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.removeQueries({ queryKey: ["question", question.id] });
      await navigate({ to: ADMIN_ROUTES.questions });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete question",
      );
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (input: {
      reviewStatus: QuestionReviewStatus;
      reviewNotes: string;
    }) => {
      const response = await questionApi.updateQuestion(questionId, {
        reviewStatus: input.reviewStatus,
        reviewNotes: input.reviewNotes.trim() ? input.reviewNotes.trim() : null,
      });
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: async (question) => {
      toast.success("Review state updated");
      await queryClient.invalidateQueries({ queryKey: ["questions"] });
      await queryClient.invalidateQueries({ queryKey: ["question", question.id] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to save review state",
      );
    },
  });

  useEffect(() => {
    if (!questionQuery.data) {
      return;
    }

    setReviewStatus(questionQuery.data.reviewStatus);
    setReviewNotes(questionQuery.data.reviewNotes ?? "");
  }, [
    questionQuery.data?.id,
    questionQuery.data?.reviewNotes,
    questionQuery.data?.reviewStatus,
  ]);

  if (questionQuery.isLoading) {
    return (
      <PagePanel className="bg-white/88">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Spinner className="h-4 w-4" />
          Loading review page...
        </div>
      </PagePanel>
    );
  }

  if (questionQuery.error instanceof Error || !questionQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Could not load question review</AlertTitle>
        <AlertDescription>
          {questionQuery.error instanceof Error
            ? questionQuery.error.message
            : "Question data is missing."}
        </AlertDescription>
      </Alert>
    );
  }

  const question = questionQuery.data;
  const variableDefinitions = question.variablesSchema ?? [];
  const previewResults = previewQuery.data ?? [];
  const selectedReviewStatus =
    reviewStatusOptions.find((option) => option.value === reviewStatus) ??
    reviewStatusOptions[0];

  return (
    <div className="space-y-4">
      <PagePanel className="space-y-6 bg-white/88">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <Button asChild variant="outline" className="border-slate-300/80 bg-white">
              <Link to={ADMIN_ROUTES.questions}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to list
              </Link>
            </Button>
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Question Review
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{question.questionCode}</Badge>
                <Badge variant={question.isPublished ? "default" : "secondary"}>
                  {question.isPublished ? "Published" : "Draft"}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {getQuestionTypeLabel(question.type)}
                </Badge>
                <Badge
                  variant={difficultyToneMap[question.difficulty]}
                  className="capitalize"
                >
                  {question.difficulty}
                </Badge>
                <Badge
                  variant={question.mode === "variable" ? "secondary" : "outline"}
                  className="capitalize"
                >
                  {question.mode}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {question.reviewStatus.replace("_", " ")}
                </Badge>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">
                  Question review
                </h2>
                <p className="max-w-3xl text-sm leading-7 text-slate-600">
                  Review the rendered content, taxonomy placement, variable rules,
                  and publish state before editing or approving this question.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <ReviewStatCard label="Mode" value={question.mode} tone="sky" />
                <ReviewStatCard
                  label="Review"
                  value={question.reviewStatus.replace("_", " ")}
                  tone="amber"
                />
                <ReviewStatCard label="Marks" value={`${question.marks}`} />
                <ReviewStatCard
                  label="Variables"
                  value={`${variableDefinitions.length}`}
                  tone="emerald"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 xl:sticky xl:top-24 xl:w-[340px]">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">Publish status</p>
              <p className="text-sm text-slate-600">
                {question.isPublished
                  ? "This question is visible in the published bank."
                  : "Publishing from here will mark this question as approved."}
              </p>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/80 bg-white/90 px-4 py-3">
              <span className="text-sm font-medium text-slate-700">
                {publishMutation.isPending
                  ? "Saving..."
                  : question.isPublished
                    ? "Published"
                    : "Draft"}
              </span>
              <Switch
                checked={question.isPublished}
                disabled={publishMutation.isPending}
                onCheckedChange={() => {
                  void publishMutation.mutateAsync(question);
                }}
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button asChild className="w-full sm:col-span-2">
                <Link
                  to="/questions/$questionId/edit"
                  params={{ questionId: question.id }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit question
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full border-slate-300/80 bg-white"
                disabled={duplicateMutation.isPending || deleteMutation.isPending}
                onClick={() => {
                  void duplicateMutation.mutateAsync(question);
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                {duplicateMutation.isPending ? "Duplicating..." : "Duplicate"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full border-slate-300/80 bg-white"
                disabled={
                  previewQuery.isFetching ||
                  duplicateMutation.isPending ||
                  deleteMutation.isPending
                }
                onClick={() => {
                  void previewQuery.refetch();
                }}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh samples
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-red-200 bg-white text-red-600 hover:text-red-700 sm:col-span-2"
                    disabled={duplicateMutation.isPending || deleteMutation.isPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this question?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove <strong>{question.questionCode}</strong> from
                      the question bank. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 text-white hover:bg-red-700"
                      onClick={() => {
                        void deleteMutation.mutateAsync(question);
                      }}
                    >
                      Delete question
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
          <div className="space-y-4">
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-slate-500" />
                <h3 className="text-lg font-bold text-slate-900">Source content</h3>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Question body
                </p>
                <MathTextPreview
                  content={question.body}
                  emptyLabel="No question body."
                />
              </div>

              {question.options.length ? (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Options
                  </p>
                  <div className="space-y-2">
                    {question.options.map((option, index) => (
                      <div
                        key={option.id ?? `${option.label ?? "option"}-${index}`}
                        className="rounded-xl border border-white/80 bg-white/90 px-3 py-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700">
                            {option.label ?? String.fromCharCode(65 + index)}.
                          </span>
                          {option.isCorrect ? <Badge>Correct</Badge> : null}
                        </div>
                        <MathTextPreview
                          content={option.text}
                          emptyLabel="No option text."
                          className="mt-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {question.answerText ? (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Answer text
                  </p>
                  <MathTextPreview
                    content={question.answerText}
                    emptyLabel="No answer text."
                  />
                </div>
              ) : null}

              {question.answerFormula ? (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Answer formula
                  </p>
                  <div className="rounded-xl border border-white/80 bg-white/90 px-4 py-3 font-mono text-sm text-slate-700">
                    {question.answerFormula}
                  </div>
                </div>
              ) : null}

              {question.explanation ? (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Explanation
                  </p>
                  <MathTextPreview
                    content={question.explanation}
                    emptyLabel="No explanation."
                  />
                </div>
              ) : null}
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/92 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    Rendered samples
                  </h3>
                  <p className="text-sm text-slate-600">
                    {question.mode === "variable"
                      ? "Inspect several generated samples to catch formula or placeholder mistakes early."
                      : "Check one final render before publishing or editing."}
                  </p>
                </div>
                {previewQuery.isFetching ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Spinner className="h-4 w-4" />
                    Rendering...
                  </div>
                ) : null}
              </div>

              {previewQuery.error instanceof Error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Preview unavailable</AlertTitle>
                  <AlertDescription>{previewQuery.error.message}</AlertDescription>
                </Alert>
              ) : previewResults.length ? (
                <div
                  className={
                    previewResults.length > 1 ? "grid gap-4 xl:grid-cols-2" : "grid gap-4"
                  }
                >
                  {previewResults.map((preview, index) => (
                    <ReviewPreviewCard
                      key={`review-preview-${index}`}
                      preview={preview}
                      title={
                        previewResults.length > 1
                          ? `Sample ${index + 1}`
                          : "Rendered sample"
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                  No preview samples yet.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <PagePanel className="space-y-4 bg-white/92">
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-slate-500" />
                <h3 className="text-lg font-bold text-slate-900">Review workflow</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Review status</Label>
                  <Select
                    value={reviewStatus}
                    onValueChange={(value) => {
                      setReviewStatus(value as QuestionReviewStatus);
                    }}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reviewStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-slate-600">
                    {selectedReviewStatus.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-notes">Reviewer notes</Label>
                  <Textarea
                    id="review-notes"
                    value={reviewNotes}
                    onChange={(event) => {
                      setReviewNotes(event.target.value);
                    }}
                    placeholder="Leave notes for authors or reviewers here."
                    className="min-h-28 bg-white"
                  />
                  <p className="text-xs leading-5 text-slate-500">
                    Notes are especially useful when marking a question as needs changes.
                  </p>
                </div>

                <Button
                  type="button"
                  className="w-full"
                  disabled={reviewMutation.isPending}
                  onClick={() => {
                    void reviewMutation.mutateAsync({
                      reviewStatus,
                      reviewNotes,
                    });
                  }}
                >
                  {reviewMutation.isPending ? "Saving review..." : "Save review state"}
                </Button>
              </div>
            </PagePanel>

            <PagePanel className="space-y-4 bg-white/92">
              <div className="flex items-center gap-2">
                <Layers3 className="h-4 w-4 text-slate-500" />
                <h3 className="text-lg font-bold text-slate-900">Taxonomy</h3>
              </div>
              <div className="space-y-3 text-sm text-slate-700">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Grade
                  </p>
                  <p>{question.grade.code ? `${question.grade.code} · ${question.grade.name}` : question.grade.name}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Subject
                  </p>
                  <p>
                    {question.subject.code
                      ? `${question.subject.code} · ${question.subject.name}`
                      : question.subject.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Chapter
                  </p>
                  <p>
                    {question.chapter
                      ? question.chapter.code
                        ? `${question.chapter.code} · ${question.chapter.name}`
                        : question.chapter.name
                      : "No chapter selected"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Sub chapter
                  </p>
                  <p>
                    {question.subChapter
                      ? question.subChapter.code
                        ? `${question.subChapter.code} · ${question.subChapter.name}`
                        : question.subChapter.name
                      : "No sub chapter selected"}
                  </p>
                </div>
              </div>
            </PagePanel>

            <PagePanel className="space-y-4 bg-white/92">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-slate-500" />
                <h3 className="text-lg font-bold text-slate-900">Template setup</h3>
              </div>
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Mode
                    </p>
                    <p className="mt-1 text-sm font-semibold capitalize text-slate-800">
                      {question.mode}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Marks
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {question.marks} mark(s)
                    </p>
                  </div>
                </div>

                {variableDefinitions.length ? (
                  <div className="space-y-3">
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        Variables
                      </p>
                      <div className="space-y-2">
                        {variableDefinitions.map((variable) => (
                          <div
                            key={variable.key}
                            className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">{variable.key}</Badge>
                              <Badge variant="secondary">{variable.type}</Badge>
                            </div>
                            {variable.label ? (
                              <p className="mt-2 text-sm font-medium text-slate-800">
                                {variable.label}
                              </p>
                            ) : null}
                            {variable.type === "number" ? (
                              <p className="mt-1 text-sm text-slate-600">
                                Range: {variable.min ?? "?"} to {variable.max ?? "?"}
                                {variable.step ? ` • Step ${variable.step}` : ""}
                              </p>
                            ) : (
                              <p className="mt-1 text-sm text-slate-600">
                                Choices: {(variable.choices ?? []).join(", ")}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                    This question does not use template variables.
                  </div>
                )}

                {question.answerFormula ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Sigma className="h-4 w-4 text-slate-500" />
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        Formula rule
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 font-mono text-sm text-slate-700">
                      {question.answerFormula}
                    </div>
                  </div>
                ) : null}
              </div>
            </PagePanel>

            <PagePanel className="space-y-4 bg-white/92">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-slate-500" />
                <h3 className="text-lg font-bold text-slate-900">Audit snapshot</h3>
              </div>
              <div className="space-y-3 text-sm text-slate-700">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Author
                  </p>
                  <p>{question.creator?.name || question.creator?.email || "Unknown author"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Last reviewer
                  </p>
                  <p>
                    {question.reviewer?.name ||
                      question.reviewer?.email ||
                      "No reviewer recorded yet"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Last reviewed
                  </p>
                  <p>
                    {question.reviewedAt
                      ? formatDateTime(question.reviewedAt)
                      : "No review timestamp yet"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Created
                  </p>
                  <p>{formatDateTime(question.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Last updated
                  </p>
                  <p>{formatDateTime(question.updatedAt)}</p>
                </div>
              </div>
            </PagePanel>
          </div>
        </div>
      </PagePanel>
    </div>
  );
}
