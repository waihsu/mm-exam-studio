import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { ensureAuthContext, requireRoles } from "@/middlewares/rbac";
import {
  assertContentLengthWithin,
  parseJsonBodyWithSchema,
  toHttpError,
} from "../route-utils";
import {
  createPaperBlueprintSchema,
  materializePaperBlueprintSchema,
  updatePaperBlueprintSchema,
} from "../paper-blueprint.schema";
import {
  createPaperBlueprint,
  deletePaperBlueprint,
  getPublishedPaperTemplateDetail,
  getPaperBlueprintDetail,
  getPaperBlueprintPreviewSummary,
  listPublishedPaperTemplates,
  listPaperBlueprints,
  materializePublishedPaperTemplate,
  materializePaperBlueprint,
  updatePaperBlueprint,
} from "../services/paper-blueprint.service";

export const workspacePaperBlueprintRoute = new Hono<AppBindings>();

workspacePaperBlueprintRoute.get("/paper-templates", async (c) => {
  const { user } = await ensureAuthContext(c);
  return c.json(await listPublishedPaperTemplates(user.id));
});

workspacePaperBlueprintRoute.get("/paper-templates/:id", async (c) => {
  const { user } = await ensureAuthContext(c);

  try {
    const result = await getPublishedPaperTemplateDetail(user.id, c.req.param("id"));
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to load paper template.");
  }
});

workspacePaperBlueprintRoute.post("/paper-templates/:id/materialize", async (c) => {
  const { user } = await ensureAuthContext(c);
  assertContentLengthWithin(c.req.raw, 30_000, "Template materialize payload is too large.");
  const payload = await parseJsonBodyWithSchema(c.req.raw, materializePaperBlueprintSchema);

  try {
    const result = await materializePublishedPaperTemplate(user.id, c.req.param("id"), payload);
    return c.json(result, 201);
  } catch (error) {
    toHttpError(error, "Failed to generate a paper from this template.");
  }
});

workspacePaperBlueprintRoute.use("/paper-blueprints*", requireRoles("admin", "superadmin"));

workspacePaperBlueprintRoute.get("/paper-blueprints", async (c) => {
  const { user, roles } = await ensureAuthContext(c);
  return c.json(await listPaperBlueprints({ userId: user.id, roles }));
});

workspacePaperBlueprintRoute.post("/paper-blueprints", async (c) => {
  const { user } = await ensureAuthContext(c);
  assertContentLengthWithin(c.req.raw, 250_000, "Paper blueprint request is too large.");
  const payload = await parseJsonBodyWithSchema(c.req.raw, createPaperBlueprintSchema);

  try {
    const result = await createPaperBlueprint(user.id, payload);
    return c.json(result, 201);
  } catch (error) {
    toHttpError(error, "Failed to create paper blueprint.");
  }
});

workspacePaperBlueprintRoute.get("/paper-blueprints/:id", async (c) => {
  const { user, roles } = await ensureAuthContext(c);

  try {
    const result = await getPaperBlueprintDetail({ userId: user.id, roles }, c.req.param("id"));
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to load paper blueprint.");
  }
});

workspacePaperBlueprintRoute.get("/paper-blueprints/:id/preview-summary", async (c) => {
  const { user, roles } = await ensureAuthContext(c);

  try {
    const result = await getPaperBlueprintPreviewSummary(
      { userId: user.id, roles },
      c.req.param("id"),
    );
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to build paper blueprint preview summary.");
  }
});

workspacePaperBlueprintRoute.patch("/paper-blueprints/:id", async (c) => {
  const { user, roles } = await ensureAuthContext(c);
  assertContentLengthWithin(c.req.raw, 250_000, "Paper blueprint update payload is too large.");
  const payload = await parseJsonBodyWithSchema(c.req.raw, updatePaperBlueprintSchema);

  try {
    const result = await updatePaperBlueprint({ userId: user.id, roles }, c.req.param("id"), payload);
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to update paper blueprint.");
  }
});

workspacePaperBlueprintRoute.post("/paper-blueprints/:id/materialize", async (c) => {
  const { user, roles } = await ensureAuthContext(c);
  assertContentLengthWithin(c.req.raw, 30_000, "Materialize payload is too large.");
  const payload = await parseJsonBodyWithSchema(c.req.raw, materializePaperBlueprintSchema);

  try {
    const result = await materializePaperBlueprint(
      { userId: user.id, roles },
      c.req.param("id"),
      payload,
    );
    return c.json(result, 201);
  } catch (error) {
    toHttpError(error, "Failed to generate a paper from this blueprint.");
  }
});

workspacePaperBlueprintRoute.delete("/paper-blueprints/:id", async (c) => {
  const { user, roles } = await ensureAuthContext(c);

  try {
    const result = await deletePaperBlueprint({ userId: user.id, roles }, c.req.param("id"));
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to delete paper blueprint.");
  }
});
