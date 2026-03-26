import { getUserWorkspaceAccess } from "../../subscriptions/subscription.core";
import {
  countPublishedQuestionsByType,
  type CatalogFilters,
} from "./workspace-shared.service";

export const getPublishedQuestionCatalogCounts = async (
  params: CatalogFilters & {
    userId: string;
  },
) => {
  const access = await getUserWorkspaceAccess(params.userId);
  const groupedCounts = await countPublishedQuestionsByType(params, access);

  const response = {
    all: 0,
    mcq: groupedCounts.mcq ?? 0,
    true_false: groupedCounts.true_false ?? 0,
    short_answer: groupedCounts.short_answer ?? 0,
    long_answer: groupedCounts.long_answer ?? 0,
    fill_blank: groupedCounts.fill_blank ?? 0,
    matching: groupedCounts.matching ?? 0,
  };

  response.all =
    response.mcq +
    response.true_false +
    response.short_answer +
    response.long_answer +
    response.fill_blank +
    response.matching;

  return response;
};
