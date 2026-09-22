import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { ensureAuthContext } from "@/middlewares/rbac";
import {
  assertContentLengthWithin,
  parseJsonBodyWithSchema,
  toHttpError,
} from "../route-utils";
import {
  createQuestionPaper,
  deleteQuestionPaper,
  duplicateQuestionPaper,
  getQuestionPaperDetail,
  listQuestionPapers,
  updateQuestionPaper,
  updateQuestionPaperStatus,
} from "../services/paper.service";
import {
  createQuestionPaperSchema,
  updateQuestionPaperSchema,
  updateQuestionPaperStatusSchema,
} from "../workspace.schema";

export const workspacePaperCoreRoute = new Hono<AppBindings>();

workspacePaperCoreRoute.get("/papers", async (c) => {
  const { user } = await ensureAuthContext(c);
  return c.json(await listQuestionPapers(user.id));
});

workspacePaperCoreRoute.post("/papers", async (c) => {
  const { user } = await ensureAuthContext(c);
  assertContentLengthWithin(
    c.req.raw,
    180_000,
    "Question paper request is too large.",
  );
  const payload = await parseJsonBodyWithSchema(c.req.raw, createQuestionPaperSchema);

  try {
    const result = await createQuestionPaper(user.id, payload);
    return c.json(result, 201);
  } catch (error) {
    toHttpError(error, "Failed to create question paper.");
  }
});

workspacePaperCoreRoute.get("/papers/:id", async (c) => {
  const { user } = await ensureAuthContext(c);

  try {
    const result = await getQuestionPaperDetail(user.id, c.req.param("id"));
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to load question paper.");
  }
});

workspacePaperCoreRoute.patch("/papers/:id", async (c) => {
  const { user } = await ensureAuthContext(c);
  assertContentLengthWithin(
    c.req.raw,
    40_000,
    "Question paper update payload is too large.",
  );
  const payload = await parseJsonBodyWithSchema(c.req.raw, updateQuestionPaperSchema);

  try {
    const result = await updateQuestionPaper(user.id, c.req.param("id"), payload);
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to update question paper.");
  }
});

workspacePaperCoreRoute.post("/papers/:id/status", async (c) => {
  const { user } = await ensureAuthContext(c);
  const payload = await parseJsonBodyWithSchema(c.req.raw, updateQuestionPaperStatusSchema);

  try {
    const result = await updateQuestionPaperStatus(user.id, c.req.param("id"), payload);
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to update question paper status.");
  }
});

workspacePaperCoreRoute.post("/papers/:id/duplicate", async (c) => {
  const { user } = await ensureAuthContext(c);

  try {
    const result = await duplicateQuestionPaper(user.id, c.req.param("id"));
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to duplicate question paper.");
  }
});

workspacePaperCoreRoute.delete("/papers/:id", async (c) => {
  const { user } = await ensureAuthContext(c);

  try {
    const result = await deleteQuestionPaper(user.id, c.req.param("id"));
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to delete question paper.");
  }
});

