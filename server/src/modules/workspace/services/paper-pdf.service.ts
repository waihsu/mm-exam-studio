import { HTTPException } from "hono/http-exception";
import type { AppBindings } from "@/core/types/app";
import { generateQuestionPaperPdf } from "../pdf/question-paper-pdf-generator.service";
import type { QuestionPaperPdfVariant } from "../pdf/question-paper-pdf-renderer.service";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const generateQuestionPaperPdfResponse = async (params: {
  bindings?: AppBindings["Bindings"] | null;
  userId: string;
  paperId: string;
  variant?: QuestionPaperPdfVariant;
}) => {
  const bindings = params.bindings ?? {};
  const renderer = bindings.PDF_RENDERER;
  const variant = params.variant ?? "combined";

  if (renderer) {
    const rendererToken =
      (typeof bindings.PDF_RENDERER_TOKEN === "string"
        ? bindings.PDF_RENDERER_TOKEN
        : process.env.PDF_RENDERER_TOKEN ?? ""
      ).trim();

    const rendererHeaders: Record<string, string> = {
      "content-type": "application/json",
    };

    if (rendererToken) {
      rendererHeaders["x-pdf-renderer-token"] = rendererToken;
    }

    let rendererResponse: Response | null = null;
    let lastRendererError: unknown = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        rendererResponse = await renderer.fetch(
          "https://pdf-renderer.internal/render",
          {
            method: "POST",
            headers: rendererHeaders,
            body: JSON.stringify({
              userId: params.userId,
              paperId: params.paperId,
              variant,
            }),
          },
        );

        if (rendererResponse.ok || rendererResponse.status < 500 || attempt === 1) {
          break;
        }
      } catch (error) {
        lastRendererError = error;
        if (attempt === 1) {
          break;
        }
      }

      await wait(250);
    }

    if (!rendererResponse) {
      throw new HTTPException(502, {
        message:
          lastRendererError instanceof Error && lastRendererError.message.trim().length > 0
            ? `PDF renderer request failed: ${lastRendererError.message}`
            : "PDF renderer request failed.",
      });
    }

    if (!rendererResponse.ok) {
      const contentType = rendererResponse.headers.get("content-type") ?? "";
      let message = "Failed to generate PDF.";

      if (contentType.includes("application/json")) {
        const payload = (await rendererResponse.json().catch(() => null)) as
          | { message?: string }
          | null;
        message = payload?.message || message;
      }

      throw new HTTPException(502, { message });
    }

    const contentType = rendererResponse.headers.get("content-type") ?? "";
    if (!contentType.includes("application/pdf")) {
      throw new HTTPException(502, {
        message: "PDF renderer did not return a PDF response.",
      });
    }

    const responseHeaders = new Headers();
    responseHeaders.set("content-type", "application/pdf");
    responseHeaders.set(
      "content-disposition",
      rendererResponse.headers.get("content-disposition") ??
        `attachment; filename="question-paper-${params.paperId}.pdf"`,
    );

    const exportedAt = rendererResponse.headers.get("x-exported-at");
    if (exportedAt) {
      responseHeaders.set("x-exported-at", exportedAt);
    }

    responseHeaders.set("cache-control", "no-store");

    return new Response(rendererResponse.body, {
      status: 200,
      headers: responseHeaders,
    });
  }

  const result = await generateQuestionPaperPdf(params.userId, params.paperId, variant);

  const responseHeaders = new Headers();
  responseHeaders.set("content-type", "application/pdf");
  responseHeaders.set("content-disposition", `attachment; filename="${result.fileName}"`);
  if (result.exportedAt) {
    responseHeaders.set("x-exported-at", result.exportedAt);
  }
  responseHeaders.set("cache-control", "no-store");

  return new Response(result.bytes, {
    status: 200,
    headers: responseHeaders,
  });
};
