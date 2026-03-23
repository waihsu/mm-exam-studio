import { createFileRoute } from "@tanstack/react-router";
import { preloadMathRichTextRenderer } from "shared";
import { QuestionPaperDetailPage } from "@/features/question-papers/components/question-paper-detail-page";

export const Route = createFileRoute("/_app/question-papers/$paperId")({
  loader: async () => {
    await preloadMathRichTextRenderer();
  },
  component: QuestionPaperDetailRoutePage,
});

function QuestionPaperDetailRoutePage() {
  const { paperId } = Route.useParams();
  return <QuestionPaperDetailPage paperId={paperId} />;
}
