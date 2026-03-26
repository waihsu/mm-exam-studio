import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { ensureAuthContext } from "@/middlewares/rbac";
import { toHttpError } from "../route-utils";
import { getPublishedQuestionCatalogCounts } from "../services/catalog.service";

export const workspaceCatalogRoute = new Hono<AppBindings>();

const readExcludeQuestionTypes = (c: Parameters<typeof ensureAuthContext>[0]) =>
  (c.req.queries("excludeQuestionType") ?? [])
    .map((value) => value.trim())
    .filter(Boolean) as Array<
    "mcq" | "true_false" | "short_answer" | "long_answer" | "fill_blank" | "matching"
  >;

workspaceCatalogRoute.get("/catalog/counts", async (c) => {
  const { user } = await ensureAuthContext(c);
  const excludeQuestionTypes = readExcludeQuestionTypes(c);

  try {
    return c.json(
      await getPublishedQuestionCatalogCounts({
        userId: user.id,
        search: c.req.query("search"),
        gradeId: c.req.query("gradeId"),
        subjectId: c.req.query("subjectId"),
        chapterId: c.req.query("chapterId"),
        subChapterId: c.req.query("subChapterId"),
        questionType: c.req.query("questionType") as
          | "mcq"
          | "true_false"
          | "short_answer"
          | "long_answer"
          | "fill_blank"
          | "matching"
          | undefined,
        excludeQuestionTypes: excludeQuestionTypes.length > 0 ? excludeQuestionTypes : undefined,
      }),
    );
  } catch (error) {
    toHttpError(error, "Failed to load workspace catalog counts.");
  }
});
