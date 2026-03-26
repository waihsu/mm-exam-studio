import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { setAppRuntime } from "./lib/runtime";
import { generateQuestionPaperPdf } from "./modules/workspace/pdf/question-paper-pdf-generator.service";
import type { QuestionPaperPdfVariant } from "./modules/workspace/pdf/question-paper-pdf-renderer.service";

setAppRuntime("cloudflare-worker");

type RenderRequestBody = {
  userId?: string;
  paperId?: string;
  variant?: QuestionPaperPdfVariant;
};

type PdfWorkerBindings = {
  Bindings: {
    PDF_RENDERER_TOKEN?: string;
  };
};

const app = new Hono<PdfWorkerBindings>();

const toHttpError = (error: unknown, fallbackMessage: string) => {
  if (error instanceof HTTPException) {
    throw error;
  }

  const message =
    error instanceof Error && error.message.trim().length > 0
      ? error.message
      : fallbackMessage;

  const normalized = message.toLowerCase();
  const status = normalized.includes("not found")
    ? 404
    : normalized.includes("already") || normalized.includes("unavailable")
      ? 409
      : 400;

  throw new HTTPException(status, { message });
};

app.post("/render", async (c) => {
  const token =
    (typeof c.env.PDF_RENDERER_TOKEN === "string"
      ? c.env.PDF_RENDERER_TOKEN
      : process.env.PDF_RENDERER_TOKEN ?? ""
    ).trim();
  const providedToken = c.req.header("x-pdf-renderer-token")?.trim() ?? "";

  if (token && providedToken !== token) {
    throw new HTTPException(401, {
      message: "Unauthorized renderer request.",
    });
  }

  const body = (await c.req.json().catch(() => null)) as RenderRequestBody | null;
  const userId = body?.userId?.trim() ?? "";
  const paperId = body?.paperId?.trim() ?? "";
  const variant = body?.variant ?? "combined";

  if (!userId || !paperId) {
    throw new HTTPException(400, {
      message: "userId and paperId are required.",
    });
  }

  try {
    const result = await generateQuestionPaperPdf(userId, paperId, variant);

    const headers = new Headers();
    headers.set("content-type", "application/pdf");
    headers.set("content-disposition", `attachment; filename="${result.fileName}"`);
    if (result.exportedAt) {
      headers.set("x-exported-at", result.exportedAt);
    }
    headers.set("cache-control", "no-store");

    return new Response(result.bytes, {
      status: 200,
      headers,
    });
  } catch (error) {
    toHttpError(error, "Failed to generate PDF.");
  }
});

app.onError((error) => {
  if (error instanceof HTTPException) {
    return error.getResponse();
  }

  const message =
    error instanceof Error && error.message.trim().length > 0
      ? error.message
      : "Internal Server Error";
  return new Response(JSON.stringify({ message }), {
    status: 500,
    headers: {
      "content-type": "application/json",
    },
  });
});

export default app;
