import fontkit from "@pdf-lib/fontkit";
import {
  PDFDocument,
  type PDFImage,
  type PDFFont,
  type PDFPage,
  rgb,
} from "pdf-lib";
import {
  NOTO_SANS_MYANMAR_REGULAR_BASE64,
  NOTO_SANS_REGULAR_BASE64,
} from "../pdf-fonts.generated";
import type { getQuestionPaperDetail } from "../services/paper.service";

export type QuestionPaperDetail = Awaited<ReturnType<typeof getQuestionPaperDetail>>;

type PdfFontPack = {
  regular: PDFFont;
  bold: PDFFont;
  myanmarRegular: PDFFont;
  myanmarBold: PDFFont;
};

const PAGE = {
  width: 595.28,
  height: 841.89,
  marginX: 44,
  marginTop: 54,
  marginBottom: 44,
};

const COLORS = {
  ink: rgb(0.09, 0.12, 0.18),
  muted: rgb(0.4, 0.45, 0.53),
  subtle: rgb(0.82, 0.86, 0.91),
  panel: rgb(0.96, 0.97, 0.99),
  accent: rgb(0.1, 0.2, 0.42),
};

const MYANMAR_REGEX = /[\u1000-\u109F\uAA60-\uAA7F]/;

const SUPERSCRIPT_MAP: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "+": "⁺",
  "-": "⁻",
  "=": "⁼",
  "(": "⁽",
  ")": "⁾",
  "n": "ⁿ",
  "i": "ⁱ",
};

const SUBSCRIPT_MAP: Record<string, string> = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
  "+": "₊",
  "-": "₋",
  "=": "₌",
  "(": "₍",
  ")": "₎",
};

const decodeBase64 = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

const extractDataUrl = (value: string | null | undefined) => {
  if (!value) return null;
  const matched = value.match(/^data:([^;]+);base64,(.+)$/);
  if (!matched) return null;
  return {
    mimeType: matched[1] || "application/octet-stream",
    bytes: decodeBase64(matched[2] || ""),
  };
};

const mapScriptCharacters = (
  value: string,
  table: Record<string, string>,
  fallbackPrefix: string,
) => {
  const mapped = Array.from(value)
    .map((char) => table[char] ?? "")
    .join("");

  if (mapped.length === value.length) {
    return mapped;
  }

  return `${fallbackPrefix}(${value})`;
};

const normalizeMathText = (value: string) =>
  value
    .replace(/\$\$?/g, "")
    .replace(/\\left|\\right/g, "")
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\cdot/g, "·")
    .replace(/\\pm/g, "±")
    .replace(/\\neq/g, "≠")
    .replace(/\\leq/g, "≤")
    .replace(/\\geq/g, "≥")
    .replace(/\\approx/g, "≈")
    .replace(/\\to|\\rightarrow/g, "→")
    .replace(/\\leftarrow/g, "←")
    .replace(/\\pi/g, "π")
    .replace(/\\theta/g, "θ")
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\gamma/g, "γ")
    .replace(/\\delta/g, "δ")
    .replace(/\\lambda/g, "λ")
    .replace(/\\mu/g, "μ")
    .replace(/\\sigma/g, "σ")
    .replace(/\\omega/g, "ω")
    .replace(/\\sin/g, "sin")
    .replace(/\\cos/g, "cos")
    .replace(/\\tan/g, "tan")
    .replace(/\\log/g, "log")
    .replace(/\\ln/g, "ln")
    .replace(/\\circ/g, "°")
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
    .replace(/\^\{([^}]+)\}/g, (_, exponent: string) =>
      mapScriptCharacters(exponent, SUPERSCRIPT_MAP, "^"),
    )
    .replace(/\^([A-Za-z0-9+\-=()])/g, (_, exponent: string) =>
      mapScriptCharacters(exponent, SUPERSCRIPT_MAP, "^"),
    )
    .replace(/_\{([^}]+)\}/g, (_, subscript: string) =>
      mapScriptCharacters(subscript, SUBSCRIPT_MAP, "_"),
    )
    .replace(/_([A-Za-z0-9+\-=()])/g, (_, subscript: string) =>
      mapScriptCharacters(subscript, SUBSCRIPT_MAP, "_"),
    )
    .replace(/\\,/g, " ")
    .replace(/\\+/g, "")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const normalizePdfText = (value: string | null | undefined, fallback = "") =>
  (value ?? fallback)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .split("\n")
    .map((line) => normalizeMathText(line.trim()))
    .join("\n")
    .trim();

const pickFont = (fonts: PdfFontPack, text: string, bold = false) => {
  if (MYANMAR_REGEX.test(text)) {
    return bold ? fonts.myanmarBold : fonts.myanmarRegular;
  }
  return bold ? fonts.bold : fonts.regular;
};

const segmentText = (text: string) =>
  text.match(/[\u1000-\u109F\uAA60-\uAA7F]+|[^\u1000-\u109F\uAA60-\uAA7F]+/g) ?? [text];

const measureText = (
  fonts: PdfFontPack,
  text: string,
  size: number,
  bold = false,
) =>
  segmentText(text).reduce((width, segment) => {
    const font = pickFont(fonts, segment, bold);
    return width + font.widthOfTextAtSize(segment, size);
  }, 0);

const wrapText = (
  fonts: PdfFontPack,
  text: string,
  width: number,
  size: number,
  bold = false,
) => {
  const normalized = normalizePdfText(text);
  if (!normalized) return [""];

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
      if (measureText(fonts, candidate, size, bold) <= width) {
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

  return lines.length > 0 ? lines : [""];
};

const loadFonts = async (pdf: PDFDocument): Promise<PdfFontPack> => {
  pdf.registerFontkit(fontkit);

  const regular = await pdf.embedFont(decodeBase64(NOTO_SANS_REGULAR_BASE64));
  const myanmarRegular = await pdf.embedFont(
    decodeBase64(NOTO_SANS_MYANMAR_REGULAR_BASE64),
  );

  return {
    regular,
    bold: regular,
    myanmarRegular,
    myanmarBold: myanmarRegular,
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
    const correctOption = item.options.find((option) => option.isCorrect);
    const answer =
      normalizePdfText(item.answerText) ||
      (correctOption
        ? [correctOption.label, normalizePdfText(correctOption.text)]
            .filter(Boolean)
            .join(" - ")
        : "No answer key");

    return `Q${index + 1}. ${answer}`;
  });

export const renderQuestionPaperPdfBytes = async (paper: QuestionPaperDetail) => {
  const pdf = await PDFDocument.create();
  const fonts = await loadFonts(pdf);
  const logo = await embedLogo(pdf, paper.brandAsset?.imageDataUrl);

  let page = pdf.addPage([PAGE.width, PAGE.height]);
  let y = PAGE.height - PAGE.marginTop;
  let pageNumber = 1;

  const contentWidth = PAGE.width - PAGE.marginX * 2;
  const footerY = 24;

  const drawTextLine = (
    text: string,
    x: number,
    drawY: number,
    size: number,
    options?: { bold?: boolean; color?: ReturnType<typeof rgb> },
  ) => {
    const normalized = normalizePdfText(text);
    let cursorX = x;
    for (const segment of segmentText(normalized)) {
      const font = pickFont(fonts, segment, options?.bold ?? false);
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
    options?: { bold?: boolean; color?: ReturnType<typeof rgb>; lineGap?: number },
  ) => {
    let cursorY = drawY;
    const lineGap = options?.lineGap ?? 4;
    for (const line of wrapText(fonts, text, width, size, options?.bold ?? false)) {
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
    drawTextLine("MM Exam Studio", PAGE.marginX, footerY, 8.5, {
      color: COLORS.muted,
    });
    const pageLabel = `Page ${pageNumber}`;
    const width = measureText(fonts, pageLabel, 8.5, true);
    drawTextLine(pageLabel, PAGE.width - PAGE.marginX - width, footerY, 8.5, {
      bold: true,
      color: COLORS.muted,
    });
  };

  const drawContinuationHeader = () => {
    drawTextLine(paper.title, PAGE.marginX, y, 11, { bold: true });
    const metaLine = buildMetaLine(paper);
    if (metaLine) {
      const width = measureText(fonts, metaLine, 9, false);
      drawTextLine(metaLine, PAGE.width - PAGE.marginX - width, y, 9, {
        color: COLORS.muted,
      });
    }
    y -= 16;
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
    drawContinuationHeader();
  };

  const ensureSpace = (heightNeeded: number) => {
    if (y - heightNeeded <= PAGE.marginBottom + 24) {
      startNewPage();
    }
  };

  const drawHeader = () => {
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
    page.drawRectangle({
      x: PAGE.marginX,
      y: y - 52,
      width: contentWidth,
      height: 52,
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
    const secondaryLine = paper.instructions
      ? normalizePdfText(paper.instructions)
      : "Read all questions carefully and answer in order.";
    drawWrapped(secondaryLine, PAGE.marginX + 12, y - 34, contentWidth - 24, 9.2, {
      color: COLORS.muted,
      lineGap: 2,
    });
    y -= 72;
  };

  const drawQuestion = (item: QuestionPaperDetail["items"][number], index: number) => {
    const questionLabel = `Q${index + 1}.`;
    const markLabel = `${item.marks} mark${item.marks > 1 ? "s" : ""}`;
    const markWidth = Math.max(62, measureText(fonts, markLabel, 8.8, true) + 18);
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

    const bodyLines = wrapText(fonts, `${questionLabel} ${item.body}`, bodyWidth, 10.8);
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
              wrapText(fonts, optionText, optionColumnWidth, optionFontSize).length,
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
                  wrapText(fonts, leftText, matchingColumnWidth, optionFontSize).length,
                )
              : 1;
            const rightLineCount = rightText
              ? Math.max(
                  1,
                  wrapText(fonts, rightText, matchingColumnWidth, optionFontSize).length,
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
              wrapText(fonts, optionText, optionsWidth, optionFontSize).length,
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

  drawHeader();
  paper.items.forEach((item, index) => drawQuestion(item, index));

  if (paper.includeAnswerKey) {
    startNewPage();
    drawTextLine("Answer Key", PAGE.marginX, y, 16, { bold: true });
    y -= 24;
    for (const answerLine of buildAnswerKey(paper)) {
      const wrapped = wrapText(fonts, answerLine, contentWidth, 9.8);
      ensureSpace(wrapped.length * 14 + 8);
      y = drawWrapped(answerLine, PAGE.marginX, y, contentWidth, 9.8, {
        color: COLORS.ink,
        lineGap: 3,
      });
      y -= 4;
    }
  }

  drawFooter();
  return pdf.save();
};
