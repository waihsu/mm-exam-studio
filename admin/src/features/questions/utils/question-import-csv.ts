export const QUESTION_IMPORT_EXPECTED_HEADERS = [
  "questionCode",
  "body",
  "type",
  "difficulty",
  "mode",
  "gradeCode",
  "subjectCode",
  "chapterCode",
  "chapterName",
  "subChapterCode",
  "subChapterName",
  "marks",
  "isPublished",
  "reviewStatus",
  "reviewNotes",
  "answerText",
  "answerFormula",
  "explanation",
  "optionsJson",
  "variablesJson",
  "parametricValueSetsJson",
  "variantContentsJson",
] as const;

const REQUIRED_HEADERS = ["questionCode", "body", "type", "gradeCode", "subjectCode"] as const;

export type QuestionImportCsvRow = Record<string, string>;

export const normalizeQuestionImportText = (value: string | undefined) => value?.trim() ?? "";

const normalizeHeader = (value: string) => value.trim().replace(/^\uFEFF/, "");
const isBlankRow = (row: string[]) =>
  row.every((cell) => normalizeQuestionImportText(cell).length === 0);

const parseCsvText = (csvText: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const next = csvText[index + 1];
    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      if (!isBlankRow(row)) rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (!isBlankRow(row)) rows.push(row);
  }
  return rows;
};

export function getQuestionImportCsvRows(csvText: string) {
  const rows = parseCsvText(csvText);
  if (!rows.length) throw new Error("Paste a CSV file with a header row first.");
  const headers = rows[0].map(normalizeHeader);
  for (const header of REQUIRED_HEADERS) {
    if (!headers.includes(header)) throw new Error(`Missing required column "${header}".`);
  }
  return rows.slice(1).map((cells, index) => {
    const row: QuestionImportCsvRow = {};
    headers.forEach((header, headerIndex) => {
      row[header] = cells[headerIndex] ?? "";
    });
    return { rowNumber: index + 2, row };
  });
}

export const parseQuestionImportBoolean = (value: string, fallback = false) => {
  const normalized = normalizeQuestionImportText(value).toLowerCase();
  if (!normalized) return fallback;
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  throw new Error(`Expected a boolean value but received "${value}".`);
};

export const parseQuestionImportInteger = (value: string, fallback: number) => {
  const normalized = normalizeQuestionImportText(value);
  if (!normalized) return fallback;
  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isFinite(parsed)) throw new Error(`Expected a whole number but received "${value}".`);
  return parsed;
};

export const parseQuestionImportJsonArray = <T>(value: string, fieldLabel: string): T[] => {
  const normalized = normalizeQuestionImportText(value);
  if (!normalized) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(normalized);
  } catch {
    throw new Error(`${fieldLabel} must be valid JSON.`);
  }
  if (!Array.isArray(parsed)) throw new Error(`${fieldLabel} must be a JSON array.`);
  return parsed as T[];
};

export const parseQuestionImportEnum = <T extends string>(
  value: string,
  allowedValues: readonly T[],
  fallback: T,
  fieldLabel: string,
) => {
  const normalized = normalizeQuestionImportText(value).toLowerCase();
  if (!normalized) return fallback;
  if (allowedValues.includes(normalized as T)) return normalized as T;
  throw new Error(`${fieldLabel} must be one of: ${allowedValues.join(", ")}.`);
};
