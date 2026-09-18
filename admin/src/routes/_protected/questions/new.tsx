import { createFileRoute } from "@tanstack/react-router";
import { preloadMathTextRenderer } from "@/features/questions/components/math-text-renderer";
import { NewQuestionPage } from "@/features/questions/pages/new-question-page";

export const Route = createFileRoute("/_protected/questions/new")({
  loader: () => preloadMathTextRenderer(),
  component: NewQuestionPage,
});
