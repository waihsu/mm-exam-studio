import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, CircleHelp, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { PagePanel } from "@/components/page-container";
import { toast } from "@/components/ui/sonner";
import { questionApi } from "@/features/questions/api/question.api";
import { QuestionForm } from "@/features/questions/components/question-form";
import { useQuestionPreviewMutation } from "@/features/questions/hooks/use-question-preview-mutation";
import type {
  QuestionSubmitInput,
} from "@/features/questions/schema/question.schema";

export function NewQuestionPage() {
  const navigate = useNavigate();
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

  const createMutation = useMutation({
    mutationFn: async (input: QuestionSubmitInput) => {
      const response = await questionApi.createQuestion(input);
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: async (question) => {
      toast.success("Draft saved — ready for review");
      await queryClient.invalidateQueries({ queryKey: ["questions"] });
      await queryClient.invalidateQueries({ queryKey: ["question", question.id] });
      await navigate({
        to: "/questions/$questionId",
        params: { questionId: question.id },
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to save question");
    },
  });

  const previewMutation = useQuestionPreviewMutation();

  if (metaQuery.isLoading) {
    return (
      <PagePanel className="bg-white/88">
        <p className="text-sm text-slate-600">Loading taxonomy...</p>
      </PagePanel>
    );
  }

  if (metaQuery.error instanceof Error || !metaQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Could not load question taxonomy</AlertTitle>
        <AlertDescription>
          {metaQuery.error instanceof Error
            ? metaQuery.error.message
            : "Taxonomy data is missing."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <PagePanel className="space-y-5">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="admin-kicker text-slate-500">
            Question Authoring
          </p>
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            Create question
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Questions are linked to grade, subject, chapter, and sub chapter so
            the bank stays organized for future exam generation workflows.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
            {metaQuery.data.grades.length} grades
          </Badge>
          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
            {metaQuery.data.subjects.length} subjects
          </Badge>
          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
            {metaQuery.data.chapters.length} chapters
          </Badge>
          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            Static + variable mode
          </Badge>
        </div>
      </div>
      <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
        <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
        <p>New questions always start as drafts. Save it, inspect the review preview, then approve and publish only when it is ready.</p>
      </div>
      <QuestionForm
        meta={metaQuery.data}
        isSubmitting={createMutation.isPending}
        isPreviewing={previewMutation.isPending}
        previewResults={previewMutation.data ?? []}
        draftOnly
        submitLabel="Save draft & review"
        onSubmit={async (input) => {
          await createMutation.mutateAsync(input);
        }}
        onPreview={async (input) => {
          await previewMutation.mutateAsync(input);
        }}
      />
    </PagePanel>
  );
}
