import {
  PDFDocument,
  type PDFImage,
  type PDFPage,
  degrees,
  rgb,
} from "pdf-lib";
import type { getQuestionPaperDetail } from "../services/paper.service";
import {
  loadFonts,
  normalizePdfText,
  pickFont,
  segmentText,
  type PdfFontPack,
} from "./question-paper-pdf-text";

export type QuestionPaperDetail = Awaited<ReturnType<typeof getQuestionPaperDetail>>;
export type QuestionPaperPdfVariant = "combined" | "question" | "answer";
type RenderQuestionPaperPdfOptions = {
  watermarkLabel?: string | null;
};

const PAGE = {
  width: 595.28,
  height: 841.89,
  marginX: 44,
  marginTop: 54,
  marginBottom: 44,
};

const COLORS = {
  ink: rgb(0.125, 0.137, 0.129),
  muted: rgb(0.431, 0.439, 0.42),
  subtle: rgb(0.847, 0.831, 0.788),
  panel: rgb(0.961, 0.945, 0.91),
  accent: rgb(0.282, 0.463, 0.42),
};

const SECTION_TITLE_ONLY_REGEX = /^section\s*\(?[a-z0-9]+\)?$/i;
const DEFAULT_MATRIC_EXAM_TITLE = "MATRICULATION EXAMINATION";
const DEFAULT_MATRIC_DEPARTMENT_LINE = "DEPARTMENT OF MYANMAR EXAMINATION";
const DEFAULT_MATRIC_TIME_ALLOWED = "(3) Hours";
const DEFAULT_MATRIC_ANSWER_INSTRUCTION = "WRITE YOUR ANSWERS IN THE ANSWER BOOKLET.";

const extractDataUrl = (value: string | null | undefined) => {
  if (!value) return null;
  const matched = value.match(/^data:([^;]+);base64,(.+)$/);
  if (!matched) return null;
  return {
    mimeType: matched[1] || "application/octet-stream",
    bytes: Uint8Array.from(atob(matched[2] || ""), (char) => char.charCodeAt(0)),
  };
};

const embedLogo = async (pdf: PDFDocument, imageDataUrl: string | null | undefined) => {
  const payload = extractDataUrl(imageDataUrl);
  if (!payload) return null;

  if (payload.mimeType.includes("png")) {
    return pdf.embedPng(payload.bytes);
  }
  if (payload.mimeType.includes("jpeg") || payload.mimeType.includes("jpg")) {
    return pdf.embedJpg(payload.bytes);
  }

  return null;
};

const drawImage = (
  image: PDFImage | null,
  page: PDFPage,
  x: number,
  topY: number,
  maxWidth: number,
  maxHeight: number,
) => {
  if (!image) return;
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  page.drawImage(image, {
    x,
    y: topY - image.height * scale,
    width: image.width * scale,
    height: image.height * scale,
  });
};

const buildMetaLine = (paper: QuestionPaperDetail) =>
  [
    paper.grade?.name,
    paper.subject?.name,
    paper.chapter?.name,
    paper.subChapter?.name,
    paper.academicYear,
  ]
    .filter(Boolean)
    .join(" • ");

const buildAnswerKey = (paper: QuestionPaperDetail) =>
  paper.items.map((item, index) => {
    const answer = getAnswerLabel(item);

    return `Q${index + 1}. ${answer}`;
  });

const getAnswerLabel = (item: QuestionPaperDetail["items"][number]) => {
  const correctOptions = item.options.filter((option) => option.isCorrect);
  const answerText = normalizePdfText(item.answerText);
  if (answerText) return answerText;
  if (correctOptions.length > 0) {
    return correctOptions
      .map((option) => [option.label, normalizePdfText(option.text)].filter(Boolean).join(" - "))
      .join(", ");
  }
  return "No answer key";
};

const buildAnswerEntryTitle = (paper: QuestionPaperDetail, variant: QuestionPaperPdfVariant) => {
  if (variant === "answer") {
    return `${paper.title} - Answer Paper`;
  }

  return paper.title;
};

type PdfTemplateKey = "default" | "myanmar_matric";

type ResolvedPdfTemplate = {
  key: PdfTemplateKey;
  yearLine: string;
  examTitleLine: string;
  departmentLine: string;
  subjectLine: string;
  timeAllowedLabel: string;
  answerInstructionLine: string;
};

const resolvePdfTemplate = (paper: QuestionPaperDetail): ResolvedPdfTemplate => {
  const key: PdfTemplateKey =
    paper.pdfTemplateKey === "myanmar_matric" ? "myanmar_matric" : "default";

  const normalizedSubjectLine = normalizePdfText(paper.subject?.name || paper.title).toUpperCase();

  if (key === "myanmar_matric") {
    return {
      key,
      yearLine: normalizePdfText(paper.examYearLabel || paper.academicYear || "").toUpperCase(),
      examTitleLine: DEFAULT_MATRIC_EXAM_TITLE,
      departmentLine: normalizePdfText(
        paper.departmentLine || DEFAULT_MATRIC_DEPARTMENT_LINE,
      ).toUpperCase(),
      subjectLine: normalizedSubjectLine,
      timeAllowedLabel: normalizePdfText(
        paper.timeAllowedLabel || DEFAULT_MATRIC_TIME_ALLOWED,
      ),
      answerInstructionLine: normalizePdfText(
        paper.answerInstructionLine || DEFAULT_MATRIC_ANSWER_INSTRUCTION,
      ).toUpperCase(),
    };
  }

  return {
    key,
    yearLine: normalizePdfText(paper.examYearLabel || ""),
    examTitleLine: normalizePdfText(paper.title),
    departmentLine: normalizePdfText(paper.departmentLine || ""),
    subjectLine: normalizedSubjectLine,
    timeAllowedLabel: normalizePdfText(paper.timeAllowedLabel || ""),
    answerInstructionLine: normalizePdfText(paper.answerInstructionLine || ""),
  };
};

const buildSectionHeading = (
  section:
    | {
        code?: string | null;
        title?: string | null;
      }
    | null
    | undefined,
) => {
  const sectionCode = normalizePdfText(section?.code || "").toUpperCase();
  const heading = sectionCode ? `SECTION (${sectionCode})` : "SECTION";
  const normalizedTitle = normalizePdfText(section?.title || "");
  if (!normalizedTitle || SECTION_TITLE_ONLY_REGEX.test(normalizedTitle)) {
    return {
      heading,
      subtitle: "",
    };
  }
  return {
    heading,
    subtitle: normalizedTitle,
  };
};

const groupItemsBySection = (items: QuestionPaperDetail["items"]) => {
  const groups: Array<{
    section:
      | {
          code?: string | null;
          title?: string | null;
          sortOrder?: number | null;
        }
      | null;
    items: QuestionPaperDetail["items"];
  }> = [];

  for (const item of items) {
    const section = item.blueprintOrigin?.section
      ? {
          code: item.blueprintOrigin.section.code,
          title: item.blueprintOrigin.section.title,
          sortOrder: item.blueprintOrigin.section.sortOrder,
        }
      : null;

    const lastGroup = groups[groups.length - 1];
    if (
      lastGroup &&
      (lastGroup.section?.code ?? null) === (section?.code ?? null)
    ) {
      lastGroup.items.push(item);
      continue;
    }

    groups.push({
      section,
      items: [item],
    });
  }

  return groups;
};

export const renderQuestionPaperPdfBytes = async (
  paper: QuestionPaperDetail,
  variant: QuestionPaperPdfVariant = "combined",
  options?: RenderQuestionPaperPdfOptions,
) => {
  const pdf = await PDFDocument.create();
  const fonts = await loadFonts(pdf);
  const logo = await embedLogo(pdf, paper.brandAsset?.imageDataUrl);
  const examTemplate = resolvePdfTemplate(paper);
  const normalizedTextCache = new Map<string, string>();
  const segmentedTextCache = new Map<string, string[]>();
  const measuredTextCache = new Map<string, number>();
  const wrappedTextCache = new Map<string, string[]>();

  let page = pdf.addPage([PAGE.width, PAGE.height]);
  let y = PAGE.height - PAGE.marginTop;
  let pageNumber = 1;

  const contentWidth = PAGE.width - PAGE.marginX * 2;
  const footerY = 24;
  const watermarkLabel = normalizePdfText(options?.watermarkLabel || "").toUpperCase();

  const drawWatermark = () => {
    if (!watermarkLabel) return;

    const watermarkColor = rgb(0.88, 0.91, 0.89);
    const positions = [
      { x: PAGE.marginX + 18, y: PAGE.height - 180 },
      { x: PAGE.width / 2 - 20, y: PAGE.height - 260 },
      { x: PAGE.marginX + 28, y: PAGE.height - 430 },
      { x: PAGE.width / 2 - 10, y: PAGE.height - 560 },
    ];

    for (const position of positions) {
      page.drawText(watermarkLabel, {
        x: position.x,
        y: position.y,
        size: 26,
        font: fonts.serifBold,
        color: watermarkColor,
        rotate: degrees(-28),
      });
    }
  };

  const getNormalizedText = (value: string | null | undefined, fallback = "") => {
    const cacheKey = `${fallback}__${value ?? ""}`;
    const cached = normalizedTextCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const normalized = normalizePdfText(value, fallback);
    normalizedTextCache.set(cacheKey, normalized);
    return normalized;
  };

  const getSegmentedText = (text: string) => {
    const cached = segmentedTextCache.get(text);
    if (cached) {
      return cached;
    }

    const segments = segmentText(text);
    segmentedTextCache.set(text, segments);
    return segments;
  };

  const getMeasuredText = (text: string, size: number, bold = false, serif = false) => {
    const cacheKey = `${bold ? "b" : "r"}|${serif ? "s" : "n"}|${size}|${text}`;
    const cached = measuredTextCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const width = getSegmentedText(text).reduce((total, segment) => {
      const font = pickFont(fonts, segment, bold, serif);
      return total + font.widthOfTextAtSize(segment, size);
    }, 0);

    measuredTextCache.set(cacheKey, width);
    return width;
  };

  const getWrappedText = (
    text: string,
    width: number,
    size: number,
    bold = false,
    serif = false,
  ) => {
    const normalized = getNormalizedText(text);
    const cacheKey = `${bold ? "b" : "r"}|${serif ? "s" : "n"}|${size}|${width}|${normalized}`;
    const cached = wrappedTextCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    if (!normalized) {
      const empty = [""];
      wrappedTextCache.set(cacheKey, empty);
      return empty;
    }

    const paragraphs = normalized.split("\n").flatMap((line) => line.split(/<br\s*\/?>/i));
    const lines: string[] = [];

    for (const paragraph of paragraphs) {
      const words = paragraph.trim().split(/\s+/).filter(Boolean);
      if (words.length === 0) {
        lines.push("");
        continue;
      }

      let current = "";
      for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (getMeasuredText(candidate, size, bold, serif) <= width) {
          current = candidate;
          continue;
        }

        if (current) {
          lines.push(current);
        }
        current = word;
      }

      if (current) {
        lines.push(current);
      }
    }

    const wrapped = lines.length > 0 ? lines : [""];
    wrappedTextCache.set(cacheKey, wrapped);
    return wrapped;
  };

  const drawTextLine = (
    text: string,
    x: number,
    drawY: number,
    size: number,
    options?: { bold?: boolean; serif?: boolean; color?: ReturnType<typeof rgb> },
  ) => {
    const normalized = getNormalizedText(text);
    let cursorX = x;
    for (const segment of getSegmentedText(normalized)) {
      const font = pickFont(fonts, segment, options?.bold ?? false, options?.serif ?? false);
      page.drawText(segment, {
        x: cursorX,
        y: drawY,
        size,
        font,
        color: options?.color ?? COLORS.ink,
      });
      cursorX += font.widthOfTextAtSize(segment, size);
    }
  };

  const drawWrapped = (
    text: string,
    x: number,
    drawY: number,
    width: number,
    size: number,
    options?: {
      bold?: boolean;
      serif?: boolean;
      color?: ReturnType<typeof rgb>;
      lineGap?: number;
    },
  ) => {
    let cursorY = drawY;
    const lineGap = options?.lineGap ?? 4;
    for (const line of getWrappedText(
      text,
      width,
      size,
      options?.bold ?? false,
      options?.serif ?? false,
    )) {
      if (line) {
        drawTextLine(line, x, cursorY, size, options);
      }
      cursorY -= size + lineGap;
    }
    return cursorY;
  };

  const drawFooter = () => {
    page.drawLine({
      start: { x: PAGE.marginX, y: footerY + 14 },
      end: { x: PAGE.width - PAGE.marginX, y: footerY + 14 },
      thickness: 0.8,
      color: COLORS.subtle,
    });
    const pageLabel = `Page ${pageNumber}`;
    if (examTemplate.key === "myanmar_matric") {
      const width = getMeasuredText(pageLabel, 8.5, true, true);
      drawTextLine(pageLabel, PAGE.width - PAGE.marginX - width, footerY, 8.5, {
        bold: true,
        serif: true,
        color: COLORS.muted,
      });
      return;
    }

    drawTextLine("MM Exam Studio", PAGE.marginX, footerY, 8.5, {
      color: COLORS.muted,
    });
    const width = getMeasuredText(pageLabel, 8.5, true);
    drawTextLine(pageLabel, PAGE.width - PAGE.marginX - width, footerY, 8.5, {
      bold: true,
      color: COLORS.muted,
    });
  };

  const drawContinuationHeader = () => {
    if (examTemplate.key === "myanmar_matric") {
      drawTextLine(examTemplate.subjectLine, PAGE.marginX, y, 10.5, {
        bold: true,
        serif: true,
      });
      y -= 14;
    } else {
      drawTextLine(buildAnswerEntryTitle(paper, variant), PAGE.marginX, y, 11, {
        bold: true,
      });
      const metaLine = buildMetaLine(paper);
      if (metaLine) {
        const width = getMeasuredText(metaLine, 9, false);
        drawTextLine(metaLine, PAGE.width - PAGE.marginX - width, y, 9, {
          color: COLORS.muted,
        });
      }
      y -= 16;
    }
    page.drawLine({
      start: { x: PAGE.marginX, y },
      end: { x: PAGE.width - PAGE.marginX, y },
      thickness: 0.8,
      color: COLORS.subtle,
    });
    y -= 18;
  };

  const startNewPage = () => {
    drawFooter();
    page = pdf.addPage([PAGE.width, PAGE.height]);
    pageNumber += 1;
    y = PAGE.height - PAGE.marginTop;
    drawWatermark();
    drawContinuationHeader();
  };

  const ensureSpace = (heightNeeded: number) => {
    if (y - heightNeeded <= PAGE.marginBottom + 24) {
      startNewPage();
    }
  };

  const drawHeader = () => {
    if (examTemplate.key === "myanmar_matric") {
      const centerX = PAGE.width / 2;
      const drawCentered = (
        text: string,
        drawY: number,
        size: number,
        options?: { bold?: boolean; color?: ReturnType<typeof rgb> },
      ) => {
        const width = getMeasuredText(text, size, options?.bold ?? false, true);
        drawTextLine(text, centerX - width / 2, drawY, size, {
          bold: options?.bold,
          serif: true,
          color: options?.color,
        });
      };

      if (examTemplate.yearLine) {
        drawCentered(examTemplate.yearLine, y, 12, { bold: true });
        y -= 20;
      }
      drawCentered(examTemplate.examTitleLine, y, 13.5, { bold: true });
      y -= 19;
      drawCentered(examTemplate.departmentLine, y, 11, { bold: true });
      y -= 19;
      drawCentered(examTemplate.subjectLine, y, 13, { bold: true });

      const timeAllowed = `Time Allowed: ${examTemplate.timeAllowedLabel}`;
      const timeWidth = getMeasuredText(timeAllowed, 10.4, false, true);
      drawTextLine(timeAllowed, PAGE.width - PAGE.marginX - timeWidth, PAGE.height - PAGE.marginTop + 2, 10.4, {
        serif: true,
      });

      y -= 24;
      drawCentered(examTemplate.answerInstructionLine, y, 10.4, { bold: true });
      y -= 16;

      if (variant === "answer") {
        drawCentered("ANSWER PAPER", y, 11.2, { bold: true });
        y -= 18;
      }

      if (paper.instructions) {
        y = drawWrapped(paper.instructions, PAGE.marginX, y, contentWidth, 9.6, {
          serif: true,
          color: COLORS.muted,
          lineGap: 3,
        });
        y -= 6;
      }

      page.drawLine({
        start: { x: PAGE.marginX, y },
        end: { x: PAGE.width - PAGE.marginX, y },
        thickness: 0.8,
        color: COLORS.subtle,
      });
      y -= 18;
      return;
    }

    drawImage(logo, page, PAGE.marginX, PAGE.height - PAGE.marginTop + 8, 54, 54);

    const titleX = PAGE.marginX + (logo ? 68 : 0);
    drawTextLine(paper.schoolName || "MM Exam Studio", titleX, y, 10, {
      bold: true,
      color: COLORS.muted,
    });
    y -= 22;
    drawTextLine(paper.title, titleX, y, 21, {
      bold: true,
    });
    y -= 22;

    const metaLine = buildMetaLine(paper);
    if (metaLine) {
      drawTextLine(metaLine, titleX, y, 10, { color: COLORS.muted });
      y -= 18;
    }

    const teacherLine = paper.teacherName
      ? `Prepared by ${normalizePdfText(paper.teacherName)}`
      : "Prepared by MM Exam Studio";
    drawTextLine(teacherLine, titleX, y, 9.5, { color: COLORS.muted });

    y -= 26;
    const secondaryLine = paper.instructions
      ? normalizePdfText(paper.instructions)
      : variant === "answer"
        ? "Answer paper for the finalized question set."
        : "Read all questions carefully and answer in order.";
    const secondaryLines = getWrappedText(secondaryLine, contentWidth - 24, 9.2);
    const panelHeight = Math.max(52, 40 + secondaryLines.length * 11.2);

    page.drawRectangle({
      x: PAGE.marginX,
      y: y - panelHeight,
      width: contentWidth,
      height: panelHeight,
      color: COLORS.panel,
      borderColor: COLORS.subtle,
      borderWidth: 1,
    });
    drawTextLine(
      `Questions: ${paper.totalQuestions} • Total marks: ${paper.totalMarks}`,
      PAGE.marginX + 12,
      y - 16,
      10.5,
      { bold: true },
    );
    drawWrapped(secondaryLine, PAGE.marginX + 12, y - 34, contentWidth - 24, 9.2, {
      color: COLORS.muted,
      lineGap: 2,
    });
    y -= panelHeight + 20;
  };

  const drawQuestion = (item: QuestionPaperDetail["items"][number], index: number) => {
    if (examTemplate.key === "myanmar_matric") {
      const questionLabel = `(${index + 1})`;
      const markLabel = `(${item.marks} mark${item.marks > 1 ? "s" : ""})`;
      const markWidth = getMeasuredText(markLabel, 10, false, true);
      const bodyWidth = contentWidth - markWidth - 18;
      const bodyX = PAGE.marginX;
      const bodyLines = getWrappedText(`${questionLabel} ${item.body}`, bodyWidth, 11, false, true);
      const optionWidth = contentWidth - 18;
      const optionLineGap = 3;
      const optionFontSize = 10;
      const optionHeights = item.options.map((option) => {
        const text = `${option.label ?? "•"} ${option.text}`;
        return Math.max(1, getWrappedText(text, optionWidth, optionFontSize, false, true).length);
      });
      const estimatedHeight =
        bodyLines.length * 15 +
        (item.options.length > 0
          ? optionHeights.reduce((sum, count) => sum + count * (optionFontSize + optionLineGap), 0) +
            item.options.length * 4 +
            8
          : 0) +
        18;

      ensureSpace(Math.max(estimatedHeight, 48));

      drawWrapped(`${questionLabel} ${item.body}`, bodyX, y, bodyWidth, 11, {
        serif: true,
        lineGap: 4,
      });
      drawTextLine(markLabel, PAGE.width - PAGE.marginX - markWidth, y, 10, {
        serif: true,
      });

      let cursorY = y - bodyLines.length * 15 - 2;
      for (const option of item.options) {
        cursorY = drawWrapped(
          `${option.label ?? "•"} ${option.text}`,
          PAGE.marginX + 18,
          cursorY,
          optionWidth - 18,
          optionFontSize,
          {
            serif: true,
            lineGap: optionLineGap,
          },
        );
        cursorY -= 4;
      }

      y = cursorY - 10;
      return;
    }

    const questionLabel = `Q${index + 1}.`;
    const markLabel = `${item.marks} mark${item.marks > 1 ? "s" : ""}`;
    const markWidth = Math.max(62, getMeasuredText(markLabel, 8.8, true) + 18);
    const bodyX = PAGE.marginX + 12;
    const bodyWidth = contentWidth - 24 - markWidth - 10;
    const optionsX = bodyX + 14;
    const optionsWidth = bodyWidth - 14;
    const optionFontSize = 9.6;
    const optionLineGap = 3;
    const optionRowGap = 2;
    const optionUnitHeight = optionFontSize + optionLineGap;
    const isMatchingQuestion =
      item.questionType === "matching" && item.options.length > 0;
    const matchingLeftItems = isMatchingQuestion
      ? item.options.map((option, optionIndex) => {
          const left = normalizePdfText(option.label);
          return left || `Item ${optionIndex + 1}`;
        })
      : [];
    const matchingRightItems = isMatchingQuestion
      ? item.options
          .map((option) => normalizePdfText(option.text))
          .filter((text) => text.length > 0)
      : [];
    const matchingRightBank = (() => {
      if (!isMatchingQuestion) return [] as string[];
      if (matchingRightItems.length <= 1) return matchingRightItems;
      const offset = (index + 1) % matchingRightItems.length;
      return matchingRightItems.map(
        (_, rightIndex) => matchingRightItems[(rightIndex + offset) % matchingRightItems.length],
      );
    })();
    const matchingColumnGap = 12;
    const matchingColumnWidth = (optionsWidth - matchingColumnGap) / 2;
    const matchingHeaderHeight = isMatchingQuestion ? optionFontSize + 4 : 0;
    const useOptionGrid =
      item.options.length > 0 &&
      (item.questionType === "mcq" || item.questionType === "true_false");
    const optionColumnCount = useOptionGrid && item.options.length > 1 ? 2 : 1;
    const optionColumnGap = optionColumnCount > 1 ? 12 : 0;
    const optionColumnWidth =
      optionColumnCount > 1
        ? (optionsWidth - optionColumnGap) / optionColumnCount
        : optionsWidth;

    const questionBodyText = `${questionLabel} ${item.body}`;
    const bodyLines = getWrappedText(questionBodyText, bodyWidth, 10.8);
    const optionRowHeights = useOptionGrid
      ? Array.from({ length: Math.ceil(item.options.length / optionColumnCount) }, (_, rowIndex) => {
          let maxLines = 1;
          for (let columnIndex = 0; columnIndex < optionColumnCount; columnIndex += 1) {
            const optionIndex = rowIndex * optionColumnCount + columnIndex;
            const option = item.options[optionIndex];
            if (!option) continue;
            const optionText = `${option.label ?? "•"} ${option.text}`;
            const lineCount = Math.max(
              1,
              getWrappedText(optionText, optionColumnWidth, optionFontSize).length,
            );
            maxLines = Math.max(maxLines, lineCount);
          }
          return maxLines * optionUnitHeight;
        })
      : [];
    const matchingRowHeights = isMatchingQuestion
      ? Array.from(
          { length: Math.max(matchingLeftItems.length, matchingRightBank.length) },
          (_, rowIndex) => {
            const leftText = matchingLeftItems[rowIndex]
              ? `${rowIndex + 1}. ${matchingLeftItems[rowIndex]}`
              : "";
            const rightText = matchingRightBank[rowIndex]
              ? `${String.fromCharCode(65 + (rowIndex % 26))}. ${matchingRightBank[rowIndex]}`
              : "";
            const leftLineCount = leftText
              ? Math.max(
                  1,
                  getWrappedText(leftText, matchingColumnWidth, optionFontSize).length,
                )
              : 1;
            const rightLineCount = rightText
              ? Math.max(
                  1,
                  getWrappedText(rightText, matchingColumnWidth, optionFontSize).length,
                )
              : 1;
            return Math.max(leftLineCount, rightLineCount) * optionUnitHeight;
          },
        )
      : [];
    const optionBlockHeight = item.options.length > 0
      ? isMatchingQuestion
        ? matchingHeaderHeight +
          matchingRowHeights.reduce((total, rowHeight) => total + rowHeight, 0) +
          Math.max(0, matchingRowHeights.length - 1) * optionRowGap +
          4
        : useOptionGrid
        ? optionRowHeights.reduce((total, rowHeight) => total + rowHeight, 0) +
          Math.max(0, optionRowHeights.length - 1) * optionRowGap +
          4
        : item.options.reduce((total, option, optionIndex) => {
            const optionText = `${option.label ?? "•"} ${option.text}`;
            const lineCount = Math.max(
              1,
              getWrappedText(optionText, optionsWidth, optionFontSize).length,
            );
            return (
              total +
              lineCount * optionUnitHeight +
              (optionIndex > 0 ? optionRowGap : 0)
            );
          }, 4)
      : 0;
    const estimatedHeight =
      24 +
      bodyLines.length * 15 +
      optionBlockHeight +
      18;

    ensureSpace(Math.max(estimatedHeight, 70));

    page.drawRectangle({
      x: PAGE.marginX,
      y: y - estimatedHeight + 10,
      width: contentWidth,
      height: estimatedHeight,
      color: rgb(1, 1, 1),
      borderColor: COLORS.subtle,
      borderWidth: 1,
    });

    page.drawRectangle({
      x: PAGE.width - PAGE.marginX - markWidth - 10,
      y: y - 20,
      width: markWidth,
      height: 18,
      color: COLORS.panel,
      borderColor: COLORS.subtle,
      borderWidth: 1,
    });
    drawTextLine(
      markLabel,
      PAGE.width - PAGE.marginX - markWidth - 10 + 9,
      y - 15,
      8.8,
      { bold: true, color: COLORS.accent },
    );

    let cursorY = drawWrapped(`${questionLabel} ${item.body}`, bodyX, y - 18, bodyWidth, 10.8, {
      lineGap: 4,
    });

    if (item.options.length > 0) {
      cursorY -= 2;
      if (isMatchingQuestion) {
        drawTextLine("Column A", optionsX, cursorY, 9.2, {
          bold: true,
          color: COLORS.muted,
        });
        drawTextLine(
          "Column B",
          optionsX + matchingColumnWidth + matchingColumnGap,
          cursorY,
          9.2,
          { bold: true, color: COLORS.muted },
        );
        cursorY -= matchingHeaderHeight;

        const rowCount = Math.max(matchingLeftItems.length, matchingRightBank.length);
        for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
          const rowTopY = cursorY;
          const leftText = matchingLeftItems[rowIndex]
            ? `${rowIndex + 1}. ${matchingLeftItems[rowIndex]}`
            : "";
          const rightText = matchingRightBank[rowIndex]
            ? `${String.fromCharCode(65 + (rowIndex % 26))}. ${matchingRightBank[rowIndex]}`
            : "";

          if (leftText) {
            drawWrapped(
              leftText,
              optionsX,
              rowTopY,
              matchingColumnWidth,
              optionFontSize,
              { color: COLORS.ink, lineGap: optionLineGap },
            );
          }
          if (rightText) {
            drawWrapped(
              rightText,
              optionsX + matchingColumnWidth + matchingColumnGap,
              rowTopY,
              matchingColumnWidth,
              optionFontSize,
              { color: COLORS.ink, lineGap: optionLineGap },
            );
          }

          cursorY -= matchingRowHeights[rowIndex] + optionRowGap;
        }
      } else if (useOptionGrid) {
        const rowCount = Math.ceil(item.options.length / optionColumnCount);
        for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
          const rowTopY = cursorY;
          for (let columnIndex = 0; columnIndex < optionColumnCount; columnIndex += 1) {
            const optionIndex = rowIndex * optionColumnCount + columnIndex;
            const option = item.options[optionIndex];
            if (!option) continue;
            const optionText = `${option.label ?? "•"} ${option.text}`;
            drawWrapped(
              optionText,
              optionsX + columnIndex * (optionColumnWidth + optionColumnGap),
              rowTopY,
              optionColumnWidth,
              optionFontSize,
              { color: COLORS.ink, lineGap: optionLineGap },
            );
          }
          cursorY -= optionRowHeights[rowIndex] + optionRowGap;
        }
      } else {
        for (const option of item.options) {
          cursorY = drawWrapped(
            `${option.label ?? "•"} ${option.text}`,
            optionsX,
            cursorY,
            optionsWidth,
            optionFontSize,
            { color: COLORS.ink, lineGap: optionLineGap },
          );
          cursorY -= optionRowGap;
        }
      }
    } else {
      cursorY -= 2;
    }

    y = cursorY - 12;
  };

  const drawAnswerEntry = (item: QuestionPaperDetail["items"][number], index: number) => {
    if (examTemplate.key === "myanmar_matric") {
      const questionLabel = `(${index + 1})`;
      const answerLabel = `Answer: ${normalizePdfText(item.answerText) || "No answer key"}`;
      const bodyLines = getWrappedText(`${questionLabel} ${item.body}`, contentWidth, 10.6, false, true);
      const answerLines = getWrappedText(answerLabel, contentWidth - 12, 10, true, true);
      const estimatedHeight =
        bodyLines.length * 14 +
        answerLines.length * 13 +
        24;

      ensureSpace(Math.max(estimatedHeight, 52));

      let cursorY = drawWrapped(
        `${questionLabel} ${item.body}`,
        PAGE.marginX,
        y,
        contentWidth,
        10.6,
        { serif: true, lineGap: 4 },
      );
      cursorY -= 6;
      cursorY = drawWrapped(answerLabel, PAGE.marginX + 12, cursorY, contentWidth - 12, 10, {
        bold: true,
        serif: true,
        color: COLORS.accent,
        lineGap: 3,
      });
      y = cursorY - 12;
      return;
    }

    const questionLabel = `Q${index + 1}.`;
    const answerLabel = `Answer: ${getAnswerLabel(item)}`;
    const answerBodyText = `${questionLabel} ${item.body}`;
    const bodyLines = getWrappedText(answerBodyText, contentWidth, 10.4);
    const answerLines = getWrappedText(answerLabel, contentWidth - 14, 9.6, true);
    const estimatedHeight =
      28 + bodyLines.length * 14 + 12 + answerLines.length * 13 + 14;

    ensureSpace(Math.max(estimatedHeight, 84));

    page.drawRectangle({
      x: PAGE.marginX,
      y: y - estimatedHeight + 10,
      width: contentWidth,
      height: estimatedHeight,
      color: rgb(1, 1, 1),
      borderColor: COLORS.subtle,
      borderWidth: 1,
    });

    let cursorY = drawWrapped(
      `${questionLabel} ${item.body}`,
      PAGE.marginX + 12,
      y - 18,
      contentWidth - 24,
      10.4,
      { lineGap: 4 },
    );

    cursorY -= 2;
    page.drawRectangle({
      x: PAGE.marginX + 12,
      y: cursorY - answerLines.length * 13 - 10,
      width: contentWidth - 24,
      height: answerLines.length * 13 + 14,
      color: COLORS.panel,
      borderColor: COLORS.subtle,
      borderWidth: 1,
    });

    cursorY = drawWrapped(
      answerLabel,
      PAGE.marginX + 19,
      cursorY - 12,
      contentWidth - 38,
      9.6,
      {
        bold: true,
        color: COLORS.accent,
        lineGap: 3,
      },
    );

    y = cursorY - 16;
  };

  const drawSectionHeading = (
    section:
      | {
          code?: string | null;
          title?: string | null;
        }
      | null
      | undefined,
  ) => {
    if (examTemplate.key !== "myanmar_matric") {
      return;
    }

    const { heading, subtitle } = buildSectionHeading(section);
    const estimatedHeight = subtitle ? 42 : 28;
    ensureSpace(estimatedHeight);
    drawWrapped(heading, PAGE.marginX, y, contentWidth, 11.5, {
      bold: true,
      serif: true,
      lineGap: 3,
    });
    y -= 16;

    if (subtitle) {
      drawWrapped(subtitle, PAGE.marginX, y, contentWidth, 10.2, {
        serif: true,
        lineGap: 3,
      });
      y -= 16;
    }
  };

  drawWatermark();
  drawHeader();
  const groupedItems = groupItemsBySection(paper.items);
  if (variant === "answer") {
    let answerIndex = 0;
    for (const group of groupedItems) {
      if (group.section) {
        drawSectionHeading(group.section);
      }
      for (const item of group.items) {
        drawAnswerEntry(item, answerIndex);
        answerIndex += 1;
      }
    }
  } else {
    let questionIndex = 0;
    for (const group of groupedItems) {
      if (group.section) {
        drawSectionHeading(group.section);
      }
      for (const item of group.items) {
        drawQuestion(item, questionIndex);
        questionIndex += 1;
      }
    }
  }

  if (variant === "combined" && paper.includeAnswerKey) {
    startNewPage();
    if (examTemplate.key === "myanmar_matric") {
      const title = "ANSWER KEY";
      const titleWidth = getMeasuredText(title, 14, true, true);
      drawTextLine(title, PAGE.width / 2 - titleWidth / 2, y, 14, {
        bold: true,
        serif: true,
      });
      y -= 24;
    } else {
      drawTextLine("Answer Key", PAGE.marginX, y, 16, { bold: true });
      y -= 24;
    }
    for (const answerLine of buildAnswerKey(paper)) {
      const wrapped = getWrappedText(answerLine, contentWidth, 9.8, false, examTemplate.key === "myanmar_matric");
      ensureSpace(wrapped.length * 14 + 8);
      y = drawWrapped(answerLine, PAGE.marginX, y, contentWidth, 9.8, {
        color: COLORS.ink,
        lineGap: 3,
        serif: examTemplate.key === "myanmar_matric",
      });
      y -= 4;
    }
  }

  drawFooter();
  return pdf.save();
};
