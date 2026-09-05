import { describe, expect, test } from "bun:test";
import { buildQuestionPreviewRequests } from "../src/features/questions/utils/question-preview-requests";
import type { QuestionPreviewRequestInput } from "../src/features/questions/schema/question.schema";

const input = (overrides: Partial<QuestionPreviewRequestInput> = {}): QuestionPreviewRequestInput => ({
  type: "short_answer",
  mode: "static",
  stem: "Solve for x",
  marks: 1,
  correctAnswer: "12",
  explanation: "Subtract 7.",
  options: [],
  variablesSchema: [],
  parametricValueSets: [],
  ...overrides,
});

describe("question preview requests", () => {
  test("uses one request for a static question", () => {
    expect(buildQuestionPreviewRequests(input())).toHaveLength(1);
  });

  test("uses every fixed parametric set in its matching order", () => {
    const requests = buildQuestionPreviewRequests(
      input({
        mode: "variable",
        parametricValueSets: [{ x: 1 }, { x: 2 }],
      }),
    );
    expect(requests.map((request) => request.parametricSetIndex)).toEqual([0, 1]);
  });

  test("creates three independent samples for a variable question without fixed sets", () => {
    const requests = buildQuestionPreviewRequests(input({ mode: "variable" }));
    expect(requests).toHaveLength(3);
    expect(requests.slice(1).every((request) => request.previewValues === undefined)).toBe(true);
  });
});
