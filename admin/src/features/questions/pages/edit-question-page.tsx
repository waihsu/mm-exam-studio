import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, PencilLine, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PagePanel } from "@/components/page-container";
import { toast } from "@/components/ui/sonner";
import { ADMIN_ROUTES } from "@/constants/routes";
import { questionApi } from "@/features/questions/api/question.api";
import { QuestionForm } from "@/features/questions/components/question-form";
import { getQuestionTypeLabel } from "@/features/questions/components/question-form.constants";
import { useQuestionPreviewMutation } from "@/features/questions/hooks/use-question-preview-mutation";
import type {
  QuestionSubmitInput,
} from "@/features/questions/schema/question.schema";

type EditQuestionPageProps = {
  questionId: string;
};

export function EditQuestionPage({ questionId }: EditQuestionPageProps) {
  const queryClient = useQueryClient();

  const metaQuery = useQuery({
    queryKey: ["question-meta"],
    queryFn: async () => {
      const response = await questionApi.getMeta();
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });

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

  const updateMutation = useMutation({
    mutationFn: async (input: QuestionSubmitInput) => {
      const response = await questionApi.updateQuestion(questionId, input);
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: async (question) => {
      toast.success("Question updated");
      await queryClient.invalidateQueries({ queryKey: ["questions"] });
      await queryClient.invalidateQueries({ queryKey: ["question", question.id] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update question",
      );
    },
  });

  const previewMutation = useQuestionPreviewMutation();

  if (metaQuery.isLoading || questionQuery.isLoading) {
    return (
      <PagePanel className="bg-white/88">
        <p className="text-sm text-slate-600">Loading question editor...</p>
      </PagePanel>
    );
  }

  if (
    metaQuery.error instanceof Error ||
    questionQuery.error instanceof Error ||
    !metaQuery.data ||
    !questionQuery.data
  ) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Could not load question editor</AlertTitle>
        <AlertDescription>
          {metaQuery.error instanceof Error
            ? metaQuery.error.message
            : questionQuery.error instanceof Error
              ? questionQuery.error.message
              : "Question data is missing."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <PagePanel className="space-y-5">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Button asChild variant="outline" className="border-slate-300/80 bg-white">
            <Link to={ADMIN_ROUTES.questions}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to list
            </Link>
          </Button>
          <div className="space-y-2">
            <p className="admin-kicker text-slate-500">
              Question Editor
            </p>
            <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
              Edit question
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Update wording, taxonomy, options, and publish state without leaving
              the question bank workflow.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
            {questionQuery.data.questionCode}
          </Badge>
          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700 capitalize">
            {getQuestionTypeLabel(questionQuery.data.type)}
          </Badge>
          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700 capitalize">
            {questionQuery.data.mode}
          </Badge>
          <Badge
            variant="outline"
            className={
              questionQuery.data.isPublished
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }
          >
            {questionQuery.data.isPublished ? "Published" : "Draft"}
          </Badge>
          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
            <PencilLine className="mr-1 h-3.5 w-3.5" />
            Live editing
          </Badge>
          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            Preview before save
          </Badge>
        </div>
      </div>

      <QuestionForm
        meta={metaQuery.data}
        initialValue={questionQuery.data}
        isSubmitting={updateMutation.isPending}
        isPreviewing={previewMutation.isPending}
        previewResults={previewMutation.data ?? []}
        submitLabel="Save changes"
        onSubmit={async (input) => {
          await updateMutation.mutateAsync(input);
        }}
        onPreview={async (input) => {
          await previewMutation.mutateAsync(input);
        }}
      />
    </PagePanel>
  );
}
