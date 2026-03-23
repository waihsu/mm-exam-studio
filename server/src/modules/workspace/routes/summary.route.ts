import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { ensureAuthContext } from "@/middlewares/rbac";
import { toHttpError } from "../route-utils";
import { getWorkspaceMeta, getWorkspaceSummary } from "../services/summary.service";

export const workspaceSummaryRoute = new Hono<AppBindings>();

workspaceSummaryRoute.get("/summary", async (c) => {
  const { user } = await ensureAuthContext(c);

  try {
    return c.json(await getWorkspaceSummary(user.id));
  } catch (error) {
    toHttpError(error, "Failed to load workspace summary.");
  }
});

workspaceSummaryRoute.get("/meta", async (c) => {
  return c.json(await getWorkspaceMeta());
});

