import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { ensureAuthContext } from "@/middlewares/rbac";
import {
  assertContentLengthWithin,
  parseJsonBodyWithSchema,
  toHttpError,
} from "../route-utils";
import {
  createPracticeSession,
  deletePracticeSession,
  getPracticeSessionDetail,
  listPracticeSessions,
  submitPracticeSession,
} from "../services/practice.service";
import {
  createPracticeSessionSchema,
  submitPracticeSessionSchema,
} from "../workspace.schema";

export const workspacePracticeRoute = new Hono<AppBindings>();

workspacePracticeRoute.get("/practice/sessions", async (c) => {
  const { user } = await ensureAuthContext(c);
  return c.json(await listPracticeSessions(user.id));
});

workspacePracticeRoute.post("/practice/sessions", async (c) => {
  const { user } = await ensureAuthContext(c);
  assertContentLengthWithin(
    c.req.raw,
    160_000,
    "Practice session request is too large.",
  );
  const payload = await parseJsonBodyWithSchema(c.req.raw, createPracticeSessionSchema);

  try {
    const result = await createPracticeSession(user.id, payload);
    return c.json(result, 201);
  } catch (error) {
    toHttpError(error, "Failed to create practice session.");
  }
});

workspacePracticeRoute.get("/practice/sessions/:id", async (c) => {
  const { user } = await ensureAuthContext(c);

  try {
    const result = await getPracticeSessionDetail(user.id, c.req.param("id"));
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to load practice session.");
  }
});

workspacePracticeRoute.post("/practice/sessions/:id/submit", async (c) => {
  const { user } = await ensureAuthContext(c);
  assertContentLengthWithin(
    c.req.raw,
    200_000,
    "Practice answers payload is too large.",
  );
  const payload = await parseJsonBodyWithSchema(c.req.raw, submitPracticeSessionSchema);

  try {
    const result = await submitPracticeSession(user.id, c.req.param("id"), payload);
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to submit practice session.");
  }
});

workspacePracticeRoute.delete("/practice/sessions/:id", async (c) => {
  const { user } = await ensureAuthContext(c);

  try {
    const result = await deletePracticeSession(user.id, c.req.param("id"));
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to delete practice session.");
  }
});
