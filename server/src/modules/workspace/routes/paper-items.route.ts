import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { ensureAuthContext } from "@/middlewares/rbac";
import {
  parseJsonBodyWithSchema,
  toHttpError,
} from "../route-utils";
import {
  listQuestionPaperSwapCandidates,
  removeQuestionPaperItem,
  reorderQuestionPaperItems,
  swapQuestionPaperItem,
} from "../services/paper.service";
import {
  reorderQuestionPaperItemsSchema,
  swapQuestionPaperItemSchema,
} from "../workspace.schema";

export const workspacePaperItemsRoute = new Hono<AppBindings>();

workspacePaperItemsRoute.post("/papers/:id/reorder", async (c) => {
  const { user } = await ensureAuthContext(c);
  const payload = await parseJsonBodyWithSchema(c.req.raw, reorderQuestionPaperItemsSchema);

  try {
    const result = await reorderQuestionPaperItems(user.id, c.req.param("id"), payload);
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to reorder question paper items.");
  }
});

workspacePaperItemsRoute.post("/papers/:id/items/:itemId/swap", async (c) => {
  const { user } = await ensureAuthContext(c);
  const payload = await parseJsonBodyWithSchema(c.req.raw, swapQuestionPaperItemSchema);

  try {
    const result = await swapQuestionPaperItem(
      user.id,
      c.req.param("id"),
      c.req.param("itemId"),
      payload,
    );
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to swap question paper item.");
  }
});

workspacePaperItemsRoute.get("/papers/:id/items/:itemId/candidates", async (c) => {
  const { user } = await ensureAuthContext(c);

  try {
    const result = await listQuestionPaperSwapCandidates(
      user.id,
      c.req.param("id"),
      c.req.param("itemId"),
    );
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to load swap candidates.");
  }
});

workspacePaperItemsRoute.delete("/papers/:id/items/:itemId", async (c) => {
  const { user } = await ensureAuthContext(c);

  try {
    const result = await removeQuestionPaperItem(
      user.id,
      c.req.param("id"),
      c.req.param("itemId"),
    );
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to remove question paper item.");
  }
});

