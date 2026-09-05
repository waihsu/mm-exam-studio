import { questionSchema, type QuestionSubmitInput } from "../schema/question.schema";
import type {
  QuestionDifficulty,
  QuestionMeta,
  QuestionMode,
  QuestionReviewStatus,
  QuestionType,
} from "../types/question.type";
import {
  getQuestionImportCsvRows,
  normalizeQuestionImportText,
  parseQuestionImportBoolean,
  parseQuestionImportEnum,
  parseQuestionImportInteger,
  parseQuestionImportJsonArray,
  QUESTION_IMPORT_EXPECTED_HEADERS,
  type QuestionImportCsvRow,
} from "./question-import-csv";

export type PreparedQuestionImport = {
  items: QuestionSubmitInput[];
  errors: string[];
  notices: string[];
  parsedRowCount: number;
};

const SAMPLE_STATIC_OPTIONS =
  '[{"label":"A","text":"2","isCorrect":false},{"label":"B","text":"4","isCorrect":true}]';
const SAMPLE_VARIABLES =
  '[{"key":"a","label":"First number","type":"number","min":1,"max":10,"step":1},{"key":"b","label":"Second number","type":"number","min":1,"max":10,"step":1}]';
const SAMPLE_PARAMETRIC_VALUE_SETS = '[{"a":2,"b":3},{"a":6,"b":4}]';
const SAMPLE_VARIANT_CONTENTS =
  '[{}, {"body":"Calculate {{a}} × {{b}}.","answerFormula":"a * b","explanation":"Multiply the selected values."}]';
const escapeCsvQuotes = (value: string) => value.split('"').join('""');

export const QUESTION_IMPORT_TEMPLATE_CSV = [
  QUESTION_IMPORT_EXPECTED_HEADERS.join(","),
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
    "1",
    "false",
    "draft",
    "",
    "",
    "",
    "",
    `"${escapeCsvQuotes(SAMPLE_STATIC_OPTIONS)}"`,
    "",
    "",
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
    "2",
    "false",
    "draft",
    "",
    "",
    '"a + b"',
    "",
    "",
    `"${escapeCsvQuotes(SAMPLE_VARIABLES)}"`,
    `"${escapeCsvQuotes(SAMPLE_PARAMETRIC_VALUE_SETS)}"`,
    `"${escapeCsvQuotes(SAMPLE_VARIANT_CONTENTS)}"`,
  ].join(","),
].join("\n");

const resolveGrade = (meta: QuestionMeta, gradeCode: string) => {
  const normalized = normalizeQuestionImportText(gradeCode);
  return meta.grades.find(
    (grade) =>
      grade.code?.toLowerCase() === normalized.toLowerCase() ||
      grade.name.toLowerCase() === normalized.toLowerCase(),
  );
};

const resolveSubject = (meta: QuestionMeta, subjectCode: string) => {
  const normalized = normalizeQuestionImportText(subjectCode);
  return meta.subjects.find(
    (subject) =>
      subject.code?.toLowerCase() === normalized.toLowerCase() ||
      subject.name.toLowerCase() === normalized.toLowerCase(),
  );
};

const resolveChapterId = (
  meta: QuestionMeta,
  row: QuestionImportCsvRow,
  gradeId: string,
  subjectId: string,
) => {
  const chapterCode = normalizeQuestionImportText(row.chapterCode);
  const chapterName = normalizeQuestionImportText(row.chapterName);
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
  row: QuestionImportCsvRow,
  chapterId: string | null,
) => {
  const subChapterCode = normalizeQuestionImportText(row.subChapterCode);
  const subChapterName = normalizeQuestionImportText(row.subChapterName);
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

export function prepareQuestionImport(
  csvText: string,
  meta: QuestionMeta,
): PreparedQuestionImport {
  const csvRows = getQuestionImportCsvRows(csvText);
  const items: QuestionSubmitInput[] = [];
  const errors: string[] = [];
  const notices: string[] = [];

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

      const type = parseQuestionImportEnum<QuestionType>(
        row.type,
        ["mcq", "true_false", "short_answer", "long_answer", "fill_blank", "matching"],
        "short_answer",
        "Question type",
      );
      const difficulty = parseQuestionImportEnum<QuestionDifficulty>(
        row.difficulty,
        ["easy", "medium", "hard"],
        "medium",
        "Difficulty",
      );
      const mode = parseQuestionImportEnum<QuestionMode>(
        row.mode,
        ["static", "variable"],
        "static",
        "Question mode",
      );
      const requestedReviewStatus = parseQuestionImportEnum<QuestionReviewStatus>(
        row.reviewStatus,
        ["draft", "in_review", "needs_changes", "approved"],
        "draft",
        "Review status",
      );

      const requestedPublished = parseQuestionImportBoolean(row.isPublished);
      if (requestedPublished || requestedReviewStatus !== "draft") {
        notices.push(
          `Row ${rowNumber}: imported as a draft; review and publish it from the Question Bank after QA.`,
        );
      }

      const item: QuestionSubmitInput = {
        questionCode: normalizeQuestionImportText(row.questionCode),
        body: normalizeQuestionImportText(row.body),
        type,
        difficulty,
        mode,
        reviewStatus: "draft",
        reviewNotes: null,
        gradeId: grade.id,
        subjectId: subject.id,
        chapterId,
        subChapterId,
        questionImageUrls: [],
        solutionImageUrls: [],
        explanation: normalizeQuestionImportText(row.explanation) || null,
        answerText: normalizeQuestionImportText(row.answerText) || null,
        answerFormula: normalizeQuestionImportText(row.answerFormula) || null,
        variablesSchema: parseQuestionImportJsonArray(row.variablesJson, "variablesJson"),
        parametricValueSets: parseQuestionImportJsonArray(
          row.parametricValueSetsJson,
          "parametricValueSetsJson",
        ),
        variantContents: parseQuestionImportJsonArray(
          row.variantContentsJson,
          "variantContentsJson",
        ),
        isPublished: false,
        marks: parseQuestionImportInteger(row.marks, 1),
        options: parseQuestionImportJsonArray(row.optionsJson, "optionsJson"),
      };

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
    notices,
    parsedRowCount: csvRows.length,
  };
}
