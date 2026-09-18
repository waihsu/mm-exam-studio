import { describe, expect, test } from "bun:test";
import { gradePracticeSessionAnswers } from "../src/modules/workspace/utils/practice-answer-grading";

describe("practice session rendered-snapshot contract", () => {
  test("scores every supported learner answer from the stored rendered snapshot", () => {
    const result = gradePracticeSessionAnswers({
      items: [
        {
          id: "mcq-item",
          questionType: "mcq",
          renderedOptions: [
            { label: "A", text: "10", isCorrect: false },
            { label: "B", text: "12", isCorrect: true },
          ],
        },
        {
          id: "true-false-item",
          questionType: "true_false",
          renderedOptions: [],
          renderedAnswerText: "True",
        },
        {
          id: "short-answer-item",
          questionType: "short_answer",
          renderedOptions: [],
          renderedAnswerText: "$x = 12$",
        },
        {
          id: "fill-blank-item",
          questionType: "fill_blank",
          renderedOptions: [],
          renderedAnswerText: "$2x$",
        },
        {
          id: "matching-item",
          questionType: "matching",
          renderedOptions: [
            { label: "1", text: "One", isCorrect: true },
            { label: "2", text: "Two", isCorrect: true },
          ],
        },
      ],
      answers: [
        { itemId: "mcq-item", answer: "B" },
        { itemId: "true-false-item", answer: "true" },
        { itemId: "short-answer-item", answer: "12" },
        { itemId: "fill-blank-item", answer: "2x" },
        { itemId: "matching-item", answer: '{"2":"Two","1":"One"}' },
      ],
    });

    expect(result.correctAnswers).toBe(5);
    expect(result.scorePercent).toBe(100);
    expect(result.items.every((item) => item.isCorrect)).toBe(true);
  });

  test("keeps a wrong submitted answer wrong without changing other results", () => {
    const result = gradePracticeSessionAnswers({
      items: [
        {
          id: "equation",
          questionType: "short_answer",
          renderedOptions: [],
          renderedAnswerText: "x = 12",
        },
        {
          id: "mcq",
          questionType: "mcq",
          renderedOptions: [
            { label: "A", text: "Correct", isCorrect: true },
            { label: "B", text: "Wrong", isCorrect: false },
          ],
        },
      ],
      answers: [
        { itemId: "equation", answer: "13" },
        { itemId: "mcq", answer: "A" },
      ],
    });

    expect(result.correctAnswers).toBe(1);
    expect(result.scorePercent).toBe(50);
    expect(result.items.find((item) => item.id === "equation")?.isCorrect).toBe(false);
  });
});
