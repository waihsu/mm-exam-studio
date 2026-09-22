import { createFileRoute } from "@tanstack/react-router";
import { preloadMathTextRenderer } from "@/features/questions/components/math-text-renderer";
import { EditQuestionPage } from "@/features/questions/pages/edit-question-page";

export const Route = createFileRoute("/_protected/questions/$questionId/edit")({
  loader: () => preloadMathTextRenderer(),
  component: EditQuestionRoute,
});

function EditQuestionRoute() {
  return <EditQuestionPage questionId={Route.useParams().questionId} />;
}
