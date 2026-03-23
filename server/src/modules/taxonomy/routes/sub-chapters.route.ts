import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import {
  createSubChapterSchema,
  updateSubChapterSchema,
} from "../taxonomy.schema";
import {
  createSubChapter,
  deleteSubChapter,
  getSubChaptersPage,
  updateSubChapter,
} from "../taxonomy.service";
import {
  parseJsonBodyWithSchema,
  readPositiveNumberParam,
  toHttpError,
} from "../route-utils";

export const taxonomySubChaptersRoute = new Hono<AppBindings>();

taxonomySubChaptersRoute.get("/sub-chapters", async (c) => {
  const result = await getSubChaptersPage({
    page: readPositiveNumberParam(c.req.query("page"), 1),
    pageSize: readPositiveNumberParam(c.req.query("pageSize"), 20),
  });

  return c.json(result);
});

taxonomySubChaptersRoute.post("/sub-chapters", async (c) => {
  const payload = await parseJsonBodyWithSchema(c.req.raw, createSubChapterSchema);

  try {
    const result = await createSubChapter(payload);
    return c.json(result, 201);
  } catch (error) {
    toHttpError(error, "Failed to create sub chapter");
  }
});

taxonomySubChaptersRoute.put("/sub-chapters/:id", async (c) => {
  const payload = await parseJsonBodyWithSchema(c.req.raw, updateSubChapterSchema);

  try {
    const result = await updateSubChapter(c.req.param("id"), payload);
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to update sub chapter");
  }
});

taxonomySubChaptersRoute.delete("/sub-chapters/:id", async (c) => {
  try {
    await deleteSubChapter(c.req.param("id"));
    return c.json({ success: true });
  } catch (error) {
    toHttpError(error, "Failed to delete sub chapter");
  }
});

