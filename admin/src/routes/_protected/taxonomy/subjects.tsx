import { createFileRoute } from "@tanstack/react-router";
import { SubjectsPage } from "@/features/taxonomy/pages/subjects-page";
import { validateTaxonomyPaginationSearch } from "@/features/taxonomy/taxonomy-pagination-search";

export const Route = createFileRoute("/_protected/taxonomy/subjects")({
  validateSearch: validateTaxonomyPaginationSearch,
  component: SubjectsRoute,
});

function SubjectsRoute() {
  return <SubjectsPage search={Route.useSearch()} />;
}
