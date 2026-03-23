import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { parseJsonBodyWithSchema } from "@/lib/route-utils";
import { previewQuestion } from "../services/question-preview.service";
import { getQuestionMeta } from "../services/question-read.service";
import { questionPreviewSchema } from "../question.schema";
import { toHttpError } from "../route-utils";

export const questionMetaPreviewRoute = new Hono<AppBindings>();

questionMetaPreviewRoute.get("/meta", async (c) => {
  try {
    const result = await getQuestionMeta();
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to load question metadata.");
  }
});

questionMetaPreviewRoute.post("/preview", async (c) => {
  const payload = await parseJsonBodyWithSchema(c.req.raw, questionPreviewSchema);

  try {
    const result = await previewQuestion(payload);
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to preview question.");
  }
});
