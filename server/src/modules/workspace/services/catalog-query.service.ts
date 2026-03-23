import {
  LOCKED_CATALOG_PREVIEW_LIMIT,
  buildPlanLockedCondition,
  countLockedQuestions,
  countPublishedQuestions,
  findLockedQuestionIds,
  findPublishedQuestionIds,
  loadPublishedQuestionsByIds,
  lockReasonCodeForPlan,
  type CatalogFilters,
  type PublishedQuestionRecord,
  type WorkspaceAccessPolicy,
} from "./workspace-shared.service";

export const fetchCatalogPageData = async (params: {
  filters: CatalogFilters;
  access: WorkspaceAccessPolicy;
  page: number;
  pageSize: number;
}) => {
  const lockedCondition = buildPlanLockedCondition(params.access);
  const lockReasonCode = lockReasonCodeForPlan(params.access);

  const [ids, total, lockedIds, lockedTotal] = await Promise.all([
    findPublishedQuestionIds({
      filters: params.filters,
      access: params.access,
      limit: params.pageSize,
      offset: (params.page - 1) * params.pageSize,
    }),
    countPublishedQuestions(params.filters, params.access),
    lockedCondition
      ? findLockedQuestionIds({
          filters: params.filters,
          lockedCondition,
          limit: LOCKED_CATALOG_PREVIEW_LIMIT,
        })
      : Promise.resolve([]),
    lockedCondition
      ? countLockedQuestions({
          filters: params.filters,
          lockedCondition,
        })
      : Promise.resolve(0),
  ]);

  const hydratedRows = await loadPublishedQuestionsByIds([...new Set([...ids, ...lockedIds])]);
  const rowMap = new Map(hydratedRows.map((row) => [row.id, row]));

  return {
    ids,
    total,
    lockedIds,
    lockedTotal,
    rowMap,
    lockReasonCode,
  };
};

export const lookupCatalogRows = (params: {
  ids: string[];
  rowMap: Map<string, PublishedQuestionRecord>;
}) =>
  params.ids
    .map((id) => params.rowMap.get(id))
    .filter((row): row is PublishedQuestionRecord => Boolean(row));
