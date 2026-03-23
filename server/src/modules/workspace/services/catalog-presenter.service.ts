import {
  resolveCatalogSecurityPolicy,
  toCatalogLockedQuestion,
  toCatalogQuestion,
  type CatalogLockReasonCode,
  type PublishedQuestionRecord,
  type WorkspaceAccessPolicy,
} from "./workspace-shared.service";
import { lookupCatalogRows } from "./catalog-query.service";

export const buildCatalogPageResponse = (params: {
  access: WorkspaceAccessPolicy;
  page: number;
  pageSize: number;
  ids: string[];
  total: number;
  lockedIds: string[];
  lockedTotal: number;
  lockReasonCode: CatalogLockReasonCode | null;
  rowMap: Map<string, PublishedQuestionRecord>;
}) => {
  const catalogPolicy = resolveCatalogSecurityPolicy(params.access);
  const cappedTotal =
    typeof catalogPolicy.maxReachableRows === "number"
      ? Math.min(params.total, catalogPolicy.maxReachableRows)
      : params.total;
  const rows = lookupCatalogRows({
    ids: params.ids,
    rowMap: params.rowMap,
  });
  const lockedQuestionRows = lookupCatalogRows({
    ids: params.lockedIds,
    rowMap: params.rowMap,
  });

  const lockReasonCode = params.lockReasonCode;
  const lockedRows = (() => {
    if (lockReasonCode === null) {
      return [];
    }

    return lockedQuestionRows.map((row) =>
      toCatalogLockedQuestion(row, lockReasonCode),
    );
  })();

  return {
    rows: rows.map((row) => toCatalogQuestion(row)),
    lockedRows,
    lockedTotal: params.lockedTotal,
    total: cappedTotal,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.max(1, Math.ceil(cappedTotal / params.pageSize)),
  };
};
