import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PagePanel } from "@/components/page-container";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/sonner";
import { ADMIN_ROUTES } from "@/constants/routes";
import { questionApi } from "@/features/questions/api/question.api";
import { getQuestionTypeLabel } from "@/features/questions/components/question-form.constants";
import { QuestionReviewActions } from "@/features/questions/components/question-review/question-review-actions";
import { QuestionReviewPreviewResults } from "@/features/questions/components/question-review/question-review-preview-results";
import { buildQuestionReviewPreviewInputs } from "@/features/questions/components/question-review/question-review-preview";
import { QuestionReviewWorkflow } from "@/features/questions/components/question-review/question-review-workflow";
import { QuestionReviewStatCard } from "@/features/questions/components/question-review/question-review-stat-card";
import { QuestionReviewMetadataPanels } from "@/features/questions/components/question-review/question-review-metadata-panels";
import { QuestionReviewSourceContent } from "@/features/questions/components/question-review/question-review-source-content";
import type { QuestionRecord, QuestionReviewStatus } from "@/features/questions/types/question.type";

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

type QuestionReviewPageProps = {
  questionId: string;
};

export function QuestionReviewPage({ questionId }: QuestionReviewPageProps) {
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

      const responses = await Promise.all(
        buildQuestionReviewPreviewInputs(questionQuery.data).map((input) =>
          questionApi.previewQuestion(input),
        ),
      );
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

  const reviewQuestion = questionQuery.data;

  useEffect(() => {
    if (!reviewQuestion) {
      return;
    }

    setReviewStatus(reviewQuestion.reviewStatus);
    setReviewNotes(reviewQuestion.reviewNotes ?? "");
  }, [reviewQuestion]);

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
                <QuestionReviewStatCard label="Mode" value={question.mode} tone="sky" />
                <QuestionReviewStatCard
                  label="Review"
                  value={question.reviewStatus.replace("_", " ")}
                  tone="amber"
                />
                <QuestionReviewStatCard label="Marks" value={`${question.marks}`} />
                <QuestionReviewStatCard
                  label="Variables"
                  value={`${variableDefinitions.length}`}
                  tone="emerald"
                />
              </div>
            </div>
          </div>

          <QuestionReviewActions
            question={question}
            isPublishing={publishMutation.isPending}
            isDuplicating={duplicateMutation.isPending}
            isDeleting={deleteMutation.isPending}
            isRefreshing={previewQuery.isFetching}
            onTogglePublish={() => {
              void publishMutation.mutateAsync(question);
            }}
            onDuplicate={() => {
              void duplicateMutation.mutateAsync(question);
            }}
            onRefresh={() => {
              void previewQuery.refetch();
            }}
            onDelete={() => {
              void deleteMutation.mutateAsync(question);
            }}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
          <div className="space-y-4">
            <QuestionReviewSourceContent question={question} />

            <QuestionReviewPreviewResults
              questionMode={question.mode}
              previews={previewResults}
              isRendering={previewQuery.isFetching}
              error={previewQuery.error instanceof Error ? previewQuery.error : null}
            />
          </div>

          <div className="space-y-4">
            <QuestionReviewWorkflow
              reviewStatus={reviewStatus}
              reviewNotes={reviewNotes}
              options={reviewStatusOptions}
              isSaving={reviewMutation.isPending}
              onReviewStatusChange={setReviewStatus}
              onReviewNotesChange={setReviewNotes}
              onSave={() => {
                void reviewMutation.mutateAsync({ reviewStatus, reviewNotes });
              }}
            />

            <QuestionReviewMetadataPanels
              question={question}
              variables={variableDefinitions}
            />
          </div>
        </div>
      </PagePanel>
    </div>
  );
}
