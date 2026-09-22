import { createFileRoute } from "@tanstack/react-router";
import { SubChaptersPage } from "@/features/taxonomy/pages/sub-chapters-page";
import { validateTaxonomyPaginationSearch } from "@/features/taxonomy/taxonomy-pagination-search";

export const Route = createFileRoute("/_protected/taxonomy/sub-chapters")({
  validateSearch: validateTaxonomyPaginationSearch,
  component: SubChaptersRoute,
});

function SubChaptersRoute() {
  return <SubChaptersPage search={Route.useSearch()} />;
}
