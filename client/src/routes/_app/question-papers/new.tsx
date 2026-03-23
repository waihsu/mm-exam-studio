import { createFileRoute } from "@tanstack/react-router";
import { preloadMathRichTextRenderer } from "shared";
import { NewQuestionPaperPage } from "@/features/question-papers/components/new-question-paper-page";

export const Route = createFileRoute("/_app/question-papers/new")({
  loader: async () => {
    await preloadMathRichTextRenderer();
  },
  component: NewQuestionPaperPage,
});
