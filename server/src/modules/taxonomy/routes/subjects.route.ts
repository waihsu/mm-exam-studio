import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import {
  createSubjectSchema,
  updateSubjectSchema,
} from "../taxonomy.schema";
import {
  createSubject,
  deleteSubject,
  getSubjectsPage,
  updateSubject,
} from "../taxonomy.service";
import {
  parseJsonBodyWithSchema,
  readPositiveNumberParam,
  toHttpError,
} from "../route-utils";

export const taxonomySubjectsRoute = new Hono<AppBindings>();

taxonomySubjectsRoute.get("/subjects", async (c) => {
  const result = await getSubjectsPage({
    page: readPositiveNumberParam(c.req.query("page"), 1),
    pageSize: readPositiveNumberParam(c.req.query("pageSize"), 20),
  });

  return c.json(result);
});

taxonomySubjectsRoute.post("/subjects", async (c) => {
  const payload = await parseJsonBodyWithSchema(c.req.raw, createSubjectSchema);

  try {
    const result = await createSubject(payload);
    return c.json(result, 201);
  } catch (error) {
    toHttpError(error, "Failed to create subject");
  }
});

taxonomySubjectsRoute.put("/subjects/:id", async (c) => {
  const payload = await parseJsonBodyWithSchema(c.req.raw, updateSubjectSchema);

  try {
    const result = await updateSubject(c.req.param("id"), payload);
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to update subject");
  }
});

taxonomySubjectsRoute.delete("/subjects/:id", async (c) => {
  try {
    await deleteSubject(c.req.param("id"));
    return c.json({ success: true });
  } catch (error) {
    toHttpError(error, "Failed to delete subject");
  }
});

