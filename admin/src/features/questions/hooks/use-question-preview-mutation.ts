import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";
import { questionApi } from "@/features/questions/api/question.api";
import type { QuestionPreviewRequestInput } from "@/features/questions/schema/question.schema";
import { buildQuestionPreviewRequests } from "@/features/questions/utils/question-preview-requests";

export function useQuestionPreviewMutation() {
  return useMutation({
    mutationFn: async (input: QuestionPreviewRequestInput) => {
      const responses = await Promise.all(
        buildQuestionPreviewRequests(input).map((request) => questionApi.previewQuestion(request)),
      );
      return responses.map((response) => {
        if (!response.ok) throw new Error(response.message);
        return response.data;
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to generate preview");
    },
  });
}
