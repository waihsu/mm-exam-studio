import { createFileRoute } from "@tanstack/react-router";
import { QuestionListPage } from "@/features/questions/pages/question-list-page";
import { validateQuestionListSearch } from "@/features/questions/question-list-search";

export const Route = createFileRoute("/_protected/questions/")({
  validateSearch: validateQuestionListSearch,
  component: QuestionListRoute,
});

function QuestionListRoute() {
  return <QuestionListPage search={Route.useSearch()} />;
}
