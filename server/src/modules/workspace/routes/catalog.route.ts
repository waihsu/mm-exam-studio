import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { ensureAuthContext } from "@/middlewares/rbac";
import { readPositiveNumberParam, toHttpError } from "../route-utils";
import { getPublishedQuestionCatalog } from "../services/catalog.service";

export const workspaceCatalogRoute = new Hono<AppBindings>();

workspaceCatalogRoute.get("/catalog", async (c) => {
  const { user } = await ensureAuthContext(c);
  const excludeQuestionTypes = (c.req.queries("excludeQuestionType") ?? [])
    .map((value) => value.trim())
    .filter(Boolean) as Array<
    "mcq" | "true_false" | "short_answer" | "long_answer" | "fill_blank" | "matching"
  >;

  try {
    return c.json(
      await getPublishedQuestionCatalog({
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
        page: readPositiveNumberParam(c.req.query("page"), 1),
        pageSize: readPositiveNumberParam(c.req.query("pageSize"), 20),
      }),
    );
  } catch (error) {
    toHttpError(error, "Failed to load workspace catalog.");
  }
});
