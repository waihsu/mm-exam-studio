import { eq } from "drizzle-orm";
import { db, plan } from "@/db";
import {
  FALLBACK_FREE_PLAN,
  FALLBACK_PREMIUM_PLAN,
} from "./subscription-core-shared.service";

export const getOrCreateFreePlan = async () => {
  const existing = await db.query.plan.findFirst({
    where: eq(plan.code, "free"),
  });
  if (existing) return existing;

  const [created] = await db.insert(plan).values(FALLBACK_FREE_PLAN).returning();
  return created;
};

export const getPlanCatalog = async () => {
  const rows = await db.query.plan.findMany({
    orderBy: (table, { asc }) => [asc(table.createdAt)],
  });

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.code === "premium" ? FALLBACK_PREMIUM_PLAN.name : row.name,
    description:
      row.code === "premium" ? FALLBACK_PREMIUM_PLAN.description : row.description,
    deviceLimit:
      row.code === "premium" ? FALLBACK_PREMIUM_PLAN.deviceLimit : row.deviceLimit,
    maxQuestionsPerPractice:
      row.code === "premium"
        ? FALLBACK_PREMIUM_PLAN.maxQuestionsPerPractice
        : row.maxQuestionsPerPractice,
    maxQuestionsPerPaper:
      row.code === "premium"
        ? FALLBACK_PREMIUM_PLAN.maxQuestionsPerPaper
        : row.maxQuestionsPerPaper,
    monthlyPdfExportLimit:
      row.code === "premium"
        ? FALLBACK_PREMIUM_PLAN.monthlyPdfExportLimit
        : row.monthlyPdfExportLimit,
    monthlyPaperGenerationLimit:
      row.code === "premium"
        ? FALLBACK_PREMIUM_PLAN.monthlyPaperGenerationLimit
        : row.monthlyPaperGenerationLimit,
    monthlyPaperSwapLimit:
      row.code === "premium"
        ? FALLBACK_PREMIUM_PLAN.monthlyPaperSwapLimit
        : row.monthlyPaperSwapLimit,
    brandingLogoLimit:
      row.code === "premium"
        ? FALLBACK_PREMIUM_PLAN.brandingLogoLimit
        : row.brandingLogoLimit,
    chatEnabled:
      row.code === "premium" ? FALLBACK_PREMIUM_PLAN.chatEnabled : row.chatEnabled,
    generatorEnabled:
      row.code === "premium"
        ? FALLBACK_PREMIUM_PLAN.generatorEnabled
        : row.generatorEnabled,
    offlineDrmEnabled:
      row.code === "premium"
        ? FALLBACK_PREMIUM_PLAN.offlineDrmEnabled
        : row.offlineDrmEnabled,
    screenshotBlockEnabled:
      row.code === "premium"
        ? FALLBACK_PREMIUM_PLAN.screenshotBlockEnabled
        : row.screenshotBlockEnabled,
    printAllowed:
      row.code === "premium" ? FALLBACK_PREMIUM_PLAN.printAllowed : row.printAllowed,
  }));
};
