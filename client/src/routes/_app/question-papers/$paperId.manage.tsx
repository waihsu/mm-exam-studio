import { createFileRoute } from "@tanstack/react-router";
import { preloadMathRichTextRenderer } from "shared";
import { ManageQuestionPaperPage } from "@/features/question-papers/components/manage-question-paper-page";

export const Route = createFileRoute("/_app/question-papers/$paperId/manage")({
  loader: async () => {
    await preloadMathRichTextRenderer();
  },
  component: ManageQuestionPaperRoutePage,
});

function ManageQuestionPaperRoutePage() {
  const { paperId } = Route.useParams();
  return <ManageQuestionPaperPage paperId={paperId} />;
}
