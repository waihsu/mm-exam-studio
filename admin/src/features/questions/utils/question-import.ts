import { questionSchema, type QuestionSubmitInput } from "../schema/question.schema";
import type {
  QuestionDifficulty,
  QuestionMeta,
  QuestionMode,
  QuestionReviewStatus,
  QuestionType,
} from "../types/question.type";

const EXPECTED_HEADERS = [
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
] as const;

const REQUIRED_HEADERS = [
  "questionCode",
  "body",
  "type",
  "gradeCode",
  "subjectCode",
] as const;

type CsvRow = Record<string, string>;

type PreparedQuestionImport = {
  items: QuestionSubmitInput[];
  errors: string[];
  parsedRowCount: number;
};

const SAMPLE_STATIC_OPTIONS =
  '[{"label":"A","text":"2","isCorrect":false},{"label":"B","text":"4","isCorrect":true}]';
const SAMPLE_VARIABLES =
  '[{"key":"a","label":"First number","type":"number","min":1,"max":10,"step":1},{"key":"b","label":"Second number","type":"number","min":1,"max":10,"step":1}]';
const escapeCsvQuotes = (value: string) => value.split('"').join('""');

export const QUESTION_IMPORT_TEMPLATE_CSV = [
  EXPECTED_HEADERS.join(","),
  [
    "QB-G06-MATH-IMPORT-0001",
    '"What is 2 + 2?"',
    "mcq",
    "easy",
    "static",
    "G06",
    "MATH",
    "",
    "",
    "",
    "",
    "2",
    "false",
    "draft",
    "",
    "",
    "",
    "",
    `"${escapeCsvQuotes(SAMPLE_STATIC_OPTIONS)}"`,
    "",
  ].join(","),
  [
    "QB-G06-MATH-IMPORT-0002",
    '"What is {{a}} + {{b}}?"',
    "short_answer",
    "medium",
    "variable",
    "G06",
    "MATH",
    "",
    "",
    "",
    "",
    "1",
    "false",
    "approved",
    "",
    "",
    '"a + b"',
    "",
    "",
    `"${escapeCsvQuotes(SAMPLE_VARIABLES)}"`,
  ].join(","),
].join("\n");

const normalizeHeader = (value: string) => value.trim().replace(/^\uFEFF/, "");
const normalizeText = (value: string | undefined) => value?.trim() ?? "";
const isBlankRow = (row: string[]) => row.every((cell) => normalizeText(cell).length === 0);

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
      continue;
    }

    if (char === ",") {
      row.push(cell);
      cell = "";
      continue;
    }

    if (char === "\n") {
      row.push(cell);
      if (!isBlankRow(row)) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (!isBlankRow(row)) {
      rows.push(row);
    }
  }

  return rows;
};

const parseBoolean = (value: string, fallback = false) => {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) return fallback;
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  throw new Error(`Expected a boolean value but received "${value}".`);
};

const parseInteger = (value: string, fallback: number) => {
  const normalized = normalizeText(value);
  if (!normalized) return fallback;
  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Expected a whole number but received "${value}".`);
  }
  return parsed;
};

const parseJsonArray = <T>(value: string, fieldLabel: string): T[] => {
  const normalized = normalizeText(value);
  if (!normalized) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(normalized);
  } catch {
    throw new Error(`${fieldLabel} must be valid JSON.`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`${fieldLabel} must be a JSON array.`);
  }

  return parsed as T[];
};

const resolveGrade = (meta: QuestionMeta, gradeCode: string) => {
  const normalized = normalizeText(gradeCode);
  return meta.grades.find(
    (grade) =>
      grade.code?.toLowerCase() === normalized.toLowerCase() ||
      grade.name.toLowerCase() === normalized.toLowerCase(),
  );
};

const resolveSubject = (meta: QuestionMeta, subjectCode: string) => {
  const normalized = normalizeText(subjectCode);
  return meta.subjects.find(
    (subject) =>
      subject.code?.toLowerCase() === normalized.toLowerCase() ||
      subject.name.toLowerCase() === normalized.toLowerCase(),
  );
};

const resolveChapterId = (
  meta: QuestionMeta,
  row: CsvRow,
  gradeId: string,
  subjectId: string,
) => {
  const chapterCode = normalizeText(row.chapterCode);
  const chapterName = normalizeText(row.chapterName);
  if (!chapterCode && !chapterName) {
    return null;
  }

  const chapter = meta.chapters.find((item) => {
    if (item.gradeId !== gradeId || item.subjectId !== subjectId) {
      return false;
    }

    if (chapterCode && item.code?.toLowerCase() === chapterCode.toLowerCase()) {
      return true;
    }

    if (chapterName && item.name.toLowerCase() === chapterName.toLowerCase()) {
      return true;
    }

    return false;
  });

  if (!chapter) {
    throw new Error("Chapter could not be matched for the selected grade and subject.");
  }

  return chapter.id;
};

const resolveSubChapterId = (
  meta: QuestionMeta,
  row: CsvRow,
  chapterId: string | null,
) => {
  const subChapterCode = normalizeText(row.subChapterCode);
  const subChapterName = normalizeText(row.subChapterName);
  if (!subChapterCode && !subChapterName) {
    return null;
  }

  if (!chapterId) {
    throw new Error("Sub chapter columns require a matching chapter.");
  }

  const subChapter = meta.subChapters.find((item) => {
    if (item.chapterId !== chapterId) {
      return false;
    }

    if (
      subChapterCode &&
      item.code?.toLowerCase() === subChapterCode.toLowerCase()
    ) {
      return true;
    }

    if (
      subChapterName &&
      item.name.toLowerCase() === subChapterName.toLowerCase()
    ) {
      return true;
    }

    return false;
  });

  if (!subChapter) {
    throw new Error("Sub chapter could not be matched for the selected chapter.");
  }

  return subChapter.id;
};

const parseEnum = <T extends string>(
  value: string,
  allowedValues: readonly T[],
  fallback: T,
  fieldLabel: string,
) => {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) return fallback;
  if (allowedValues.includes(normalized as T)) {
    return normalized as T;
  }

  throw new Error(
    `${fieldLabel} must be one of: ${allowedValues.join(", ")}.`,
  );
};

const toCsvRows = (csvText: string) => {
  const rows = parseCsvText(csvText);
  if (!rows.length) {
    throw new Error("Paste a CSV file with a header row first.");
  }

  const headers = rows[0].map(normalizeHeader);
  for (const header of REQUIRED_HEADERS) {
    if (!headers.includes(header)) {
      throw new Error(`Missing required column "${header}".`);
    }
  }

  return rows.slice(1).map((cells, index) => {
    const row: CsvRow = {};
    headers.forEach((header, headerIndex) => {
      row[header] = cells[headerIndex] ?? "";
    });

    return {
      rowNumber: index + 2,
      row,
    };
  });
};

export function prepareQuestionImport(
  csvText: string,
  meta: QuestionMeta,
): PreparedQuestionImport {
  const csvRows = toCsvRows(csvText);
  const items: QuestionSubmitInput[] = [];
  const errors: string[] = [];

  for (const { rowNumber, row } of csvRows) {
    try {
      const grade = resolveGrade(meta, row.gradeCode);
      if (!grade) {
        throw new Error(`Unknown grade "${row.gradeCode}".`);
      }

      const subject = resolveSubject(meta, row.subjectCode);
      if (!subject) {
        throw new Error(`Unknown subject "${row.subjectCode}".`);
      }

      const isLinked = meta.gradeSubjects.some(
        (link) => link.gradeId === grade.id && link.subjectId === subject.id,
      );
      if (!isLinked) {
        throw new Error(
          `Subject "${row.subjectCode}" is not linked to grade "${row.gradeCode}".`,
        );
      }

      const chapterId = resolveChapterId(meta, row, grade.id, subject.id);
      const subChapterId = resolveSubChapterId(meta, row, chapterId);

      const type = parseEnum<QuestionType>(
        row.type,
        ["mcq", "true_false", "short_answer", "long_answer", "fill_blank", "matching"],
        "short_answer",
        "Question type",
      );
      const difficulty = parseEnum<QuestionDifficulty>(
        row.difficulty,
        ["easy", "medium", "hard"],
        "medium",
        "Difficulty",
      );
      const mode = parseEnum<QuestionMode>(
        row.mode,
        ["static", "variable"],
        "static",
        "Question mode",
      );
      const reviewStatus = parseEnum<QuestionReviewStatus>(
        row.reviewStatus,
        ["draft", "in_review", "needs_changes", "approved"],
        "draft",
        "Review status",
      );

      const item: QuestionSubmitInput = {
        questionCode: normalizeText(row.questionCode),
        body: normalizeText(row.body),
        type,
        difficulty,
        mode,
        reviewStatus,
        reviewNotes: normalizeText(row.reviewNotes) || null,
        gradeId: grade.id,
        subjectId: subject.id,
        chapterId,
        subChapterId,
        questionImageUrls: [],
        solutionImageUrls: [],
        explanation: normalizeText(row.explanation) || null,
        answerText: normalizeText(row.answerText) || null,
        answerFormula: normalizeText(row.answerFormula) || null,
        variablesSchema: parseJsonArray(row.variablesJson, "variablesJson"),
        isPublished: parseBoolean(row.isPublished),
        marks: parseInteger(row.marks, 1),
        options: parseJsonArray(row.optionsJson, "optionsJson"),
      };

      if (item.isPublished && item.reviewStatus !== "approved") {
        throw new Error("Published rows must use reviewStatus=approved.");
      }

      const validation = questionSchema.safeParse({
        ...item,
        chapterId: item.chapterId ?? undefined,
        subChapterId: item.subChapterId ?? undefined,
        explanation: item.explanation ?? undefined,
        answerText: item.answerText ?? undefined,
        answerFormula: item.answerFormula ?? undefined,
        reviewNotes: item.reviewNotes ?? undefined,
      });

      if (!validation.success) {
        throw new Error(validation.error.issues[0]?.message ?? "Invalid row.");
      }

      items.push(item);
    } catch (error) {
      errors.push(
        `Row ${rowNumber}: ${
          error instanceof Error ? error.message : "Failed to prepare this row."
        }`,
      );
    }
  }

  return {
    items,
    errors,
    parsedRowCount: csvRows.length,
  };
}
