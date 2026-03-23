import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, CircleHelp, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { PagePanel } from "@/components/page-container";
import { toast } from "@/components/ui/sonner";
import { ADMIN_ROUTES } from "@/constants/routes";
import { questionApi } from "@/features/questions/api/question.api";
import { QuestionForm } from "@/features/questions/components/question-form";
import { preloadMathTextRenderer } from "@/features/questions/components/math-text-preview";
import type {
  QuestionPreviewRequestInput,
  QuestionSubmitInput,
} from "@/features/questions/schema/question.schema";

export const Route = createFileRoute("/_protected/questions/new")({
  loader: async () => {
    await preloadMathTextRenderer();
  },
  component: NewQuestionPage,
});

function NewQuestionPage() {
  const VARIABLE_PREVIEW_SAMPLE_COUNT = 3;
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
    onSuccess: async () => {
      toast.success("Question created");
      await queryClient.invalidateQueries({ queryKey: ["questions"] });
      await navigate({ to: ADMIN_ROUTES.questions });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to save question");
    },
  });

  const previewMutation = useMutation({
    mutationFn: async (input: QuestionPreviewRequestInput) => {
      const previewCount =
        input.mode === "variable" ? VARIABLE_PREVIEW_SAMPLE_COUNT : 1;
      const requests = Array.from({ length: previewCount }, (_, index) =>
        questionApi.previewQuestion(
          index === 0 ? input : { ...input, previewValues: undefined },
        ),
      );

      const responses = await Promise.all(requests);
      return responses.map((response) => {
        if (!response.ok) {
          throw new Error(response.message);
        }
        return response.data;
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate preview",
      );
    },
  });

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
    <PagePanel className="space-y-6 bg-white/88">
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-white/95 via-sky-50/40 to-slate-100/70 p-4 sm:p-5">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Question Authoring
          </p>
          <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">
            Create question
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            Questions are linked to grade, subject, chapter, and sub chapter so
            the bank stays organized for future exam generation workflows.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
            {metaQuery.data.grades.length} grades
          </Badge>
          <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
            {metaQuery.data.subjects.length} subjects
          </Badge>
          <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
            {metaQuery.data.chapters.length} chapters
          </Badge>
          <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            Static + variable mode
          </Badge>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-600">
          <p className="flex items-center gap-2 font-medium text-slate-700">
            <CircleHelp className="h-4 w-4 text-slate-500" />
            Tip
          </p>
          Use clear question codes and save as draft first, then review and publish after QA.
        </div>
      </div>
      <QuestionForm
        meta={metaQuery.data}
        isSubmitting={createMutation.isPending}
        isPreviewing={previewMutation.isPending}
        previewResults={previewMutation.data ?? []}
        submitLabel="Create question"
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
