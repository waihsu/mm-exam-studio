import { describe, expect, test } from "bun:test";
import { getQuestionPublishReadinessIssues } from "../src/modules/questions/utils/question-publish-readiness";

const baseQuestion = {
  body: "Solve for $x$: $x + 7 = 19$.",
  type: "short_answer" as const,
  mode: "static" as const,
  answerText: "$x = 12$",
  answerFormula: null,
  options: [],
  variablesSchema: [],
  parametricValueSets: [],
  variantContents: [],
};

describe("question publish readiness", () => {
  test("accepts a complete, gradeable short answer", () => {
    expect(getQuestionPublishReadinessIssues(baseQuestion)).toEqual([]);
  });

  test("blocks an MCQ with multiple correct options", () => {
    const issues = getQuestionPublishReadinessIssues({
      ...baseQuestion,
      type: "mcq",
      answerText: null,
      options: [
        { label: "A", text: "12", isCorrect: true },
        { label: "B", text: "13", isCorrect: true },
      ],
    });

    expect(issues).toContain("A published MCQ needs exactly one correct option.");
  });

  test("blocks an invalid true/false key and incomplete matching pairs", () => {
    expect(
      getQuestionPublishReadinessIssues({
        ...baseQuestion,
        type: "true_false",
        answerText: "Maybe",
      }),
    ).toContain('A published true/false question must use an answer key of "True" or "False".');

    expect(
      getQuestionPublishReadinessIssues({
        ...baseQuestion,
        type: "matching",
        answerText: null,
        options: [
          { label: "1", text: "One", isCorrect: true },
          { label: "1", text: "Two", isCorrect: true },
        ],
      }),
    ).toContain("Matching pair labels must be unique.");
  });

  test("renders variable answer formulas before allowing publication", () => {
    expect(
      getQuestionPublishReadinessIssues({
        ...baseQuestion,
        mode: "variable",
        answerText: null,
        answerFormula: "a / 0",
        variablesSchema: [{ key: "a", type: "number", min: 1, max: 3 }],
      }),
    ).toContain("Question preview failed: Division or modulo by zero is not allowed.");
  });
});
