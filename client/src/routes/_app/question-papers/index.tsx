import { createFileRoute } from "@tanstack/react-router";
import { QuestionPaperListPage } from "@/features/question-papers/components/question-paper-list-page";

export const Route = createFileRoute("/_app/question-papers/")({
  component: QuestionPaperListPage,
});
