import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, type PDFFont, StandardFonts } from "pdf-lib";
import {
  NOTO_SANS_MYANMAR_REGULAR_BASE64,
  NOTO_SANS_REGULAR_BASE64,
} from "../pdf-fonts.generated";

export type PdfFontPack = {
  regular: PDFFont;
  bold: PDFFont;
  serifRegular: PDFFont;
  serifBold: PDFFont;
  myanmarRegular: PDFFont;
  myanmarBold: PDFFont;
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
  n: "ⁿ",
  i: "ⁱ",
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

const mapScriptCharacters = (
  value: string,
  table: Record<string, string>,
  fallbackPrefix: string,
) => {
  const mapped = Array.from(value)
    .map((char) => table[char] ?? "")
    .join("");

  return mapped.length === value.length ? mapped : `${fallbackPrefix}(${value})`;
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

export const normalizePdfText = (value: string | null | undefined, fallback = "") =>
  (value ?? fallback)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .split("\n")
    .map((line) => normalizeMathText(line.trim()))
    .join("\n")
    .trim();

export const pickFont = (fonts: PdfFontPack, text: string, bold = false, serif = false) => {
  if (MYANMAR_REGEX.test(text)) return bold ? fonts.myanmarBold : fonts.myanmarRegular;
  if (serif) return bold ? fonts.serifBold : fonts.serifRegular;
  return bold ? fonts.bold : fonts.regular;
};

export const segmentText = (text: string) =>
  text.match(/[\u1000-\u109F\uAA60-\uAA7F]+|[^\u1000-\u109F\uAA60-\uAA7F]+/g) ?? [text];

export const loadFonts = async (pdf: PDFDocument): Promise<PdfFontPack> => {
  pdf.registerFontkit(fontkit);

  const regular = await pdf.embedFont(decodeBase64(NOTO_SANS_REGULAR_BASE64));
  const serifRegular = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const myanmarRegular = await pdf.embedFont(decodeBase64(NOTO_SANS_MYANMAR_REGULAR_BASE64));

  return {
    regular,
    bold: regular,
    serifRegular,
    serifBold,
    myanmarRegular,
    myanmarBold: myanmarRegular,
  };
};
