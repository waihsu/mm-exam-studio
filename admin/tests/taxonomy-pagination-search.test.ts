import { describe, expect, test } from "bun:test";
import { validateTaxonomyPaginationSearch } from "../src/features/taxonomy/taxonomy-pagination-search";

describe("taxonomy pagination search", () => {
  test("keeps positive page parameters and ignores malformed values", () => {
    expect(validateTaxonomyPaginationSearch({ page: "2", pageSize: 50 })).toEqual({
      page: 2,
      pageSize: 50,
    });
    expect(validateTaxonomyPaginationSearch({ page: "zero", pageSize: 0 })).toEqual({
      page: undefined,
      pageSize: undefined,
    });
  });
});
