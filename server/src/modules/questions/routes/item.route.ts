import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { parseJsonBodyWithSchema } from "@/lib/route-utils";
import { ensureAuthContext } from "@/middlewares/rbac";
import { getQuestionById } from "../services/question-read.service";
import {
  deleteQuestion,
  duplicateQuestion,
  updateQuestion,
} from "../services/question-write.service";
import { updateQuestionSchema } from "../question.schema";
import { toHttpError } from "../route-utils";

export const questionItemRoute = new Hono<AppBindings>();

questionItemRoute.post("/:id/duplicate", async (c) => {
  const id = c.req.param("id");
  const { user } = await ensureAuthContext(c);

  try {
    const result = await duplicateQuestion(id, user.id);
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to duplicate question.");
  }
});

questionItemRoute.get("/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const result = await getQuestionById(id);
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to fetch question.");
  }
});

questionItemRoute.put("/:id", async (c) => {
  const id = c.req.param("id");
  const { user } = await ensureAuthContext(c);
  const payload = await parseJsonBodyWithSchema(c.req.raw, updateQuestionSchema);

  try {
    const result = await updateQuestion(id, payload, user.id);
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to update question.");
  }
});

questionItemRoute.delete("/:id", async (c) => {
  const id = c.req.param("id");

  try {
    await deleteQuestion(id);
    return c.json({ success: true });
  } catch (error) {
    toHttpError(error, "Failed to delete question.");
  }
});
