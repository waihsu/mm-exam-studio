import {
  getQuestionPaperDetail,
  markQuestionPaperExported,
} from "../services/paper.service";
import {
  renderQuestionPaperPdfBytes,
  type QuestionPaperDetail,
  type QuestionPaperPdfVariant,
} from "./question-paper-pdf-renderer.service";

export type PdfGenerationResult = {
  bytes: Uint8Array;
  fileName: string;
  exportedAt: string | null;
  status: "draft" | "finalized";
};

const PDF_FILE_LABEL_BY_VARIANT: Record<QuestionPaperPdfVariant, string> = {
  combined: "full-pack",
  question: "question",
  answer: "answer",
};

const slugifyFileName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "question-paper";

const assertPdfVariantAllowed = (
  paper: QuestionPaperDetail,
  variant: QuestionPaperPdfVariant,
) => {
  if (variant === "answer" && !paper.includeAnswerKey) {
    throw new Error("Answer paper is not enabled for this question paper.");
  }
};

export const generateQuestionPaperPdf = async (
  userId: string,
  paperId: string,
  variant: QuestionPaperPdfVariant = "combined",
): Promise<PdfGenerationResult> => {
  const paper: QuestionPaperDetail = await getQuestionPaperDetail(userId, paperId);
  assertPdfVariantAllowed(paper, variant);
  const watermarkIdentity = (paper.teacherName || userId).trim();
  const watermarkTimestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  const bytes = await renderQuestionPaperPdfBytes(paper, variant, {
    watermarkLabel: `CONFIDENTIAL • ${watermarkIdentity} • ${watermarkTimestamp}`,
  });
  const exportResult = await markQuestionPaperExported(userId, paperId);

  return {
    bytes,
    fileName: `${slugifyFileName(paper.title)}-${PDF_FILE_LABEL_BY_VARIANT[variant]}.pdf`,
    exportedAt: exportResult.exportedAt ? exportResult.exportedAt.toISOString() : null,
    status: exportResult.status,
  };
};
