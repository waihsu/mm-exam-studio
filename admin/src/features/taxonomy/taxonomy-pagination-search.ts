export type TaxonomyPaginationSearch = {
  page?: number;
  pageSize?: number;
};

export function validateTaxonomyPaginationSearch(
  search: Record<string, unknown>,
): TaxonomyPaginationSearch {
  return {
    page: toPositiveNumber(search.page),
    pageSize: toPositiveNumber(search.pageSize),
  };
}

function toPositiveNumber(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : undefined;
  return parsed && parsed > 0 ? parsed : undefined;
}
