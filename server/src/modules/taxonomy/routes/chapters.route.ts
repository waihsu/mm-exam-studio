import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import {
  createChapterSchema,
  updateChapterSchema,
} from "../taxonomy.schema";
import {
  createChapter,
  deleteChapter,
  getChaptersPage,
  updateChapter,
} from "../taxonomy.service";
import {
  parseJsonBodyWithSchema,
  readPositiveNumberParam,
  toHttpError,
} from "../route-utils";

export const taxonomyChaptersRoute = new Hono<AppBindings>();

taxonomyChaptersRoute.get("/chapters", async (c) => {
  const result = await getChaptersPage({
    page: readPositiveNumberParam(c.req.query("page"), 1),
    pageSize: readPositiveNumberParam(c.req.query("pageSize"), 20),
  });

  return c.json(result);
});

taxonomyChaptersRoute.post("/chapters", async (c) => {
  const payload = await parseJsonBodyWithSchema(c.req.raw, createChapterSchema);

  try {
    const result = await createChapter(payload);
    return c.json(result, 201);
  } catch (error) {
    toHttpError(error, "Failed to create chapter");
  }
});

taxonomyChaptersRoute.put("/chapters/:id", async (c) => {
  const payload = await parseJsonBodyWithSchema(c.req.raw, updateChapterSchema);

  try {
    const result = await updateChapter(c.req.param("id"), payload);
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to update chapter");
  }
});

taxonomyChaptersRoute.delete("/chapters/:id", async (c) => {
  try {
    await deleteChapter(c.req.param("id"));
    return c.json({ success: true });
  } catch (error) {
    toHttpError(error, "Failed to delete chapter");
  }
});

