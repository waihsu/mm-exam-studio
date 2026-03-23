import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { parseJsonBodyWithSchema } from "@/lib/route-utils";
import { ensureAuthContext } from "@/middlewares/rbac";
import { getQuestions } from "../services/question-read.service";
import {
  createQuestion,
  importQuestions,
} from "../services/question-write.service";
import {
  createQuestionSchema,
  questionImportSchema,
} from "../question.schema";
import {
  readBooleanParam,
  readPositiveNumberParam,
  toHttpError,
} from "../route-utils";

export const questionCollectionRoute = new Hono<AppBindings>();

questionCollectionRoute.post("/", async (c) => {
  const { user } = await ensureAuthContext(c);
  const payload = await parseJsonBodyWithSchema(c.req.raw, createQuestionSchema);

  try {
    const result = await createQuestion(payload, user.id);
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to create question.");
  }
});

questionCollectionRoute.get("/", async (c) => {
  try {
    const result = await getQuestions({
      search: c.req.query("search"),
      gradeId: c.req.query("gradeId"),
      subjectId: c.req.query("subjectId"),
      chapterId: c.req.query("chapterId"),
      subChapterId: c.req.query("subChapterId"),
      type: c.req.query("type") as
        | "mcq"
        | "true_false"
        | "short_answer"
        | "long_answer"
        | "fill_blank"
        | "matching"
        | undefined,
      mode: c.req.query("mode") as "static" | "variable" | undefined,
      difficulty: c.req.query("difficulty") as
        | "easy"
        | "medium"
        | "hard"
        | undefined,
      isPublished: readBooleanParam(c.req.query("isPublished")),
      page: readPositiveNumberParam(c.req.query("page"), 1),
      pageSize: readPositiveNumberParam(c.req.query("pageSize"), 20),
    });
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to load questions.");
  }
});

questionCollectionRoute.post("/import", async (c) => {
  const { user } = await ensureAuthContext(c);
  const payload = await parseJsonBodyWithSchema(c.req.raw, questionImportSchema);

  try {
    const result = await importQuestions(payload.items, user.id);
    return c.json(result, result.summary.failed > 0 ? 207 : 201);
  } catch (error) {
    toHttpError(error, "Failed to import questions.");
  }
});
