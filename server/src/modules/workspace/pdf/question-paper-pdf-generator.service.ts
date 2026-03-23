import {
  getQuestionPaperDetail,
  markQuestionPaperExported,
} from "../services/paper.service";
import {
  renderQuestionPaperPdfBytes,
  type QuestionPaperDetail,
} from "./question-paper-pdf-renderer.service";

export type PdfGenerationResult = {
  bytes: Uint8Array;
  fileName: string;
  exportedAt: string | null;
  status: "draft" | "finalized";
};

const slugifyFileName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "question-paper";

export const generateQuestionPaperPdf = async (
  userId: string,
  paperId: string,
): Promise<PdfGenerationResult> => {
  const paper: QuestionPaperDetail = await getQuestionPaperDetail(userId, paperId);
  const bytes = await renderQuestionPaperPdfBytes(paper);
  const exportResult = await markQuestionPaperExported(userId, paperId);

  return {
    bytes,
    fileName: `${slugifyFileName(paper.title)}.pdf`,
    exportedAt: exportResult.exportedAt ? exportResult.exportedAt.toISOString() : null,
    status: exportResult.status,
  };
};
