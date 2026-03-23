import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { ensureAuthContext } from "@/middlewares/rbac";
import { toHttpError } from "../route-utils";
import { generateQuestionPaperPdfResponse } from "../services/paper-pdf.service";
import {
  listExportedPapers,
  markQuestionPaperExported,
} from "../services/paper.service";

export const workspacePaperExportRoute = new Hono<AppBindings>();

workspacePaperExportRoute.post("/papers/:id/export", async (c) => {
  const { user } = await ensureAuthContext(c);

  try {
    const result = await markQuestionPaperExported(user.id, c.req.param("id"));
    return c.json(result);
  } catch (error) {
    toHttpError(error, "Failed to mark question paper as exported.");
  }
});

workspacePaperExportRoute.get("/papers/:id/pdf", async (c) => {
  const { user } = await ensureAuthContext(c);

  try {
    return await generateQuestionPaperPdfResponse({
      bindings: c.env,
      userId: user.id,
      paperId: c.req.param("id"),
    });
  } catch (error) {
    toHttpError(error, "Failed to generate PDF.");
  }
});

workspacePaperExportRoute.get("/exports", async (c) => {
  const { user } = await ensureAuthContext(c);
  return c.json(await listExportedPapers(user.id));
});

