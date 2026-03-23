import { HTTPException } from "hono/http-exception";
import type { AppBindings } from "@/core/types/app";
import { generateQuestionPaperPdf } from "../pdf/question-paper-pdf-generator.service";

export const generateQuestionPaperPdfResponse = async (params: {
  bindings?: AppBindings["Bindings"] | null;
  userId: string;
  paperId: string;
}) => {
  const bindings = params.bindings ?? {};
  const renderer = bindings.PDF_RENDERER;

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

    const rendererResponse = await renderer.fetch(
      "https://pdf-renderer.internal/render",
      {
        method: "POST",
        headers: rendererHeaders,
        body: JSON.stringify({
          userId: params.userId,
          paperId: params.paperId,
        }),
      },
    );

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

  const result = await generateQuestionPaperPdf(params.userId, params.paperId);

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
