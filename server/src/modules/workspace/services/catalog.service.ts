import { getUserWorkspaceAccess } from "../../subscriptions/subscription.core";
import {
  assertCatalogWindowAllowed,
  resolveEffectiveCatalogPageSize,
  type CatalogFilters,
} from "./workspace-shared.service";
import { buildCatalogPageResponse } from "./catalog-presenter.service";
import { fetchCatalogPageData } from "./catalog-query.service";

export const getPublishedQuestionCatalog = async (
  params: CatalogFilters & {
    userId: string;
    page?: number;
    pageSize?: number;
  },
) => {
  const page = Math.max(1, Math.trunc(params.page ?? 1));
  const requestedPageSize = Math.max(10, Math.min(100, Math.trunc(params.pageSize ?? 20)));
  const access = await getUserWorkspaceAccess(params.userId);
  const pageSize = resolveEffectiveCatalogPageSize({
    access,
    requestedPageSize,
    page,
  });
  assertCatalogWindowAllowed({
    access,
    page,
    pageSize: Math.max(1, pageSize || requestedPageSize),
  });

  if (pageSize <= 0) {
    return {
      rows: [],
      lockedRows: [],
      lockedTotal: 0,
      total: 0,
      page,
      pageSize: 0,
      totalPages: 1,
    };
  }

  const pageData = await fetchCatalogPageData({
    filters: params,
    access,
    page,
    pageSize,
  });

  return buildCatalogPageResponse({
    access,
    page,
    pageSize,
    ids: pageData.ids,
    total: pageData.total,
    lockedIds: pageData.lockedIds,
    lockedTotal: pageData.lockedTotal,
    lockReasonCode: pageData.lockReasonCode,
    rowMap: pageData.rowMap,
  });
};
