import { createFileRoute } from "@tanstack/react-router";
import { preloadMathTextRenderer } from "@/features/questions/components/math-text-renderer";
import { QuestionReviewPage } from "@/features/questions/pages/question-review-page";

export const Route = createFileRoute("/_protected/questions/$questionId/")({
  loader: async () => {
    await preloadMathTextRenderer();
  },
  component: QuestionReviewRoute,
});

function QuestionReviewRoute() {
  return <QuestionReviewPage questionId={Route.useParams().questionId} />;
}
