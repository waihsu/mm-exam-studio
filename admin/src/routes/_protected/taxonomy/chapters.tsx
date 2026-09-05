import { createFileRoute } from "@tanstack/react-router";
import { ChaptersPage } from "@/features/taxonomy/pages/chapters-page";
import { validateTaxonomyPaginationSearch } from "@/features/taxonomy/taxonomy-pagination-search";

export const Route = createFileRoute("/_protected/taxonomy/chapters")({
  validateSearch: validateTaxonomyPaginationSearch,
  component: ChaptersRoute,
});

function ChaptersRoute() {
  return <ChaptersPage search={Route.useSearch()} />;
}
