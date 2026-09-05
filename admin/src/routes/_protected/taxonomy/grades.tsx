import { createFileRoute } from "@tanstack/react-router";
import { GradesPage } from "@/features/taxonomy/pages/grades-page";
import { validateTaxonomyPaginationSearch } from "@/features/taxonomy/taxonomy-pagination-search";

export const Route = createFileRoute("/_protected/taxonomy/grades")({
  validateSearch: validateTaxonomyPaginationSearch,
  component: GradesRoute,
});

function GradesRoute() {
  return <GradesPage search={Route.useSearch()} />;
}
