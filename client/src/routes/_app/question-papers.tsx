import { createFileRoute } from "@tanstack/react-router";
import { QuestionPapersLayout } from "@/features/question-papers/components/question-papers-layout";

export const Route = createFileRoute("/_app/question-papers")({
  component: QuestionPapersLayout,
});
