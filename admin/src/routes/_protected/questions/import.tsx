import { createFileRoute } from "@tanstack/react-router";
import { QuestionImportPage } from "@/features/questions/pages/question-import-page";

export const Route = createFileRoute("/_protected/questions/import")({
  component: QuestionImportPage,
});
