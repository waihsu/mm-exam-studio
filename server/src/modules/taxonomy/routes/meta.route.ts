import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import {
  getTaxonomyMeta,
  getTaxonomyOverview,
} from "../taxonomy.service";

export const taxonomyMetaRoute = new Hono<AppBindings>();

taxonomyMetaRoute.get("/meta", async (c) => {
  const result = await getTaxonomyMeta();
  return c.json(result);
});

taxonomyMetaRoute.get("/overview", async (c) => {
  const result = await getTaxonomyOverview();
  return c.json(result);
});

