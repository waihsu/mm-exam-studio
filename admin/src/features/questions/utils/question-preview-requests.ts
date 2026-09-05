import type { QuestionPreviewRequestInput } from "@/features/questions/schema/question.schema";

export const VARIABLE_PREVIEW_SAMPLE_COUNT = 3;

export function buildQuestionPreviewRequests(
  input: QuestionPreviewRequestInput,
): QuestionPreviewRequestInput[] {
  const fixedSetCount = input.parametricValueSets.length;
  const previewCount =
    input.mode === "variable" ? fixedSetCount || VARIABLE_PREVIEW_SAMPLE_COUNT : 1;

  return Array.from({ length: previewCount }, (_, index) => {
    if (fixedSetCount > 0) {
      return { ...input, previewValues: undefined, parametricSetIndex: index };
    }
    return index === 0 ? input : { ...input, previewValues: undefined };
  });
}
