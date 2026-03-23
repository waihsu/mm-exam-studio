import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { ensureAuthContext } from "@/middlewares/rbac";
import {
  createBrandAssetSchema,
  setPrimaryBrandAssetSchema,
} from "../branding.schema";
import {
  assertContentLengthWithin,
  parseJsonBodyWithSchema,
  toHttpError,
} from "../route-utils";
import {
  createBrandAsset,
  deleteBrandAsset,
  listBrandAssets,
  setPrimaryBrandAsset,
} from "../services/branding.service";

export const workspaceBrandingRoute = new Hono<AppBindings>();

workspaceBrandingRoute.get("/branding", async (c) => {
  const { user } = await ensureAuthContext(c);
  return c.json(await listBrandAssets(user.id));
});

workspaceBrandingRoute.post("/branding", async (c) => {
  const { user } = await ensureAuthContext(c);
  assertContentLengthWithin(
    c.req.raw,
    1_400_000,
    "Brand logo upload is too large.",
  );
  const payload = await parseJsonBodyWithSchema(c.req.raw, createBrandAssetSchema);

  try {
    const result = await createBrandAsset(user.id, payload);
    return c.json(result, 201);
  } catch (error) {
    toHttpError(error, "Failed to save brand logo.");
  }
});

workspaceBrandingRoute.post("/branding/primary", async (c) => {
  const { user } = await ensureAuthContext(c);
  const payload = await parseJsonBodyWithSchema(c.req.raw, setPrimaryBrandAssetSchema);

  try {
    const result = await setPrimaryBrandAsset(user.id, payload.brandAssetId);
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to update primary logo.");
  }
});

workspaceBrandingRoute.delete("/branding/:brandAssetId", async (c) => {
  const { user } = await ensureAuthContext(c);

  try {
    const result = await deleteBrandAsset(user.id, c.req.param("brandAssetId"));
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to delete brand logo.");
  }
});
