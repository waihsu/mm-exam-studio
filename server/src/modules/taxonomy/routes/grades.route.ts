import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import {
  createGradeSchema,
  updateGradeSchema,
} from "../taxonomy.schema";
import {
  createGrade,
  deleteGrade,
  getGradesPage,
  updateGrade,
} from "../taxonomy.service";
import {
  parseJsonBodyWithSchema,
  readPositiveNumberParam,
  toHttpError,
} from "../route-utils";

export const taxonomyGradesRoute = new Hono<AppBindings>();

taxonomyGradesRoute.get("/grades", async (c) => {
  const result = await getGradesPage({
    page: readPositiveNumberParam(c.req.query("page"), 1),
    pageSize: readPositiveNumberParam(c.req.query("pageSize"), 20),
  });

  return c.json(result);
});

taxonomyGradesRoute.post("/grades", async (c) => {
  const payload = await parseJsonBodyWithSchema(c.req.raw, createGradeSchema);

  try {
    const result = await createGrade(payload);
    return c.json(result, 201);
  } catch (error) {
    toHttpError(error, "Failed to create grade");
  }
});

taxonomyGradesRoute.put("/grades/:id", async (c) => {
  const payload = await parseJsonBodyWithSchema(c.req.raw, updateGradeSchema);

  try {
    const result = await updateGrade(c.req.param("id"), payload);
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to update grade");
  }
});

taxonomyGradesRoute.delete("/grades/:id", async (c) => {
  try {
    await deleteGrade(c.req.param("id"));
    return c.json({ success: true });
  } catch (error) {
    toHttpError(error, "Failed to delete grade");
  }
});

