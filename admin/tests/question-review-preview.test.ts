import { describe, expect, test } from "bun:test";
import { buildQuestionReviewPreviewInputs } from "../src/features/questions/components/question-review/question-review-preview";
import type { QuestionRecord } from "../src/features/questions/types/question.type";

const createQuestion = (overrides: Partial<QuestionRecord> = {}): QuestionRecord => ({
  id: "question-1",
  questionCode: "QB-G06-MATH-001",
  body: "Solve {{a}} + {{b}}.",
  type: "short_answer",
  difficulty: "medium",
  mode: "variable",
  reviewStatus: "draft",
  marks: 2,
  isPublished: false,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  grade: { id: "grade-6", code: "G06", name: "Grade 6" },
  subject: { id: "math", code: "MATH", name: "Mathematics" },
  options: [],
  ...overrides,
});

describe("question review preview inputs", () => {
  test("creates one request for a static question", () => {
    const inputs = buildQuestionReviewPreviewInputs(
      createQuestion({ mode: "static", body: "What is 2 + 2?" }),
    );

    expect(inputs).toHaveLength(1);
    expect(inputs[0]).not.toHaveProperty("parametricSetIndex");
  });

  test("creates one deterministic request for every configured value set", () => {
    const inputs = buildQuestionReviewPreviewInputs(
      createQuestion({ parametricValueSets: [{ a: 2, b: 3 }, { a: 7, b: 4 }] }),
    );

    expect(inputs).toHaveLength(2);
    expect(inputs.map((input) => input.parametricSetIndex)).toEqual([0, 1]);
  });

  test("uses three samples for a variable question without configured value sets", () => {
    expect(buildQuestionReviewPreviewInputs(createQuestion())).toHaveLength(3);
  });
});
