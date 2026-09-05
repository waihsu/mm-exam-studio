import { describe, expect, test } from "bun:test";
import { isShortAnswerEquivalent } from "../src/modules/workspace/utils/answer-grading";
import { isPracticeAnswerCorrect } from "../src/modules/workspace/utils/practice-answer-grading";

describe("short-answer grading", () => {
  test("accepts a concise value for a keyed variable assignment", () => {
    expect(isShortAnswerEquivalent("$x = 12$", "12")).toBe(true);
    expect(isShortAnswerEquivalent("x = 12", "x=12")).toBe(true);
    expect(isShortAnswerEquivalent("x = 12", "$x = 12$")).toBe(true);
  });

  test("does not accept a different variable or a different value", () => {
    expect(isShortAnswerEquivalent("x = 12", "y = 12")).toBe(false);
    expect(isShortAnswerEquivalent("x = 12", "13")).toBe(false);
    expect(isShortAnswerEquivalent("12", "x = 12")).toBe(false);
  });

  test("keeps non-equation answers exact after case and whitespace normalization", () => {
    expect(isShortAnswerEquivalent("Yangon", "  yangon ")).toBe(true);
    expect(isShortAnswerEquivalent("Yangon", "Mandalay")).toBe(false);
  });
});

describe("practice answer grading", () => {
  test("grades MCQ labels and true/false choices exactly", () => {
    expect(isPracticeAnswerCorrect({
      questionType: "mcq",
      options: [{ label: "B", text: "12", isCorrect: true }],
      submittedAnswer: "B",
    })).toBe(true);
    expect(isPracticeAnswerCorrect({
      questionType: "true_false",
      options: [],
      answerText: "True",
      submittedAnswer: " true ",
    })).toBe(true);
    expect(isPracticeAnswerCorrect({
      questionType: "true_false",
      options: [],
      answerText: "True",
      submittedAnswer: "False",
    })).toBe(false);
  });

  test("accepts plain math input when a fill-blank key uses math delimiters", () => {
    expect(isPracticeAnswerCorrect({
      questionType: "fill_blank",
      options: [],
      answerText: "$2x$",
      submittedAnswer: "2x",
    })).toBe(true);
  });

  test("requires every matching pair while allowing a different pair order", () => {
    const options = [
      { label: "1", text: "One", isCorrect: true },
      { label: "2", text: "Two", isCorrect: true },
    ];
    expect(isPracticeAnswerCorrect({
      questionType: "matching",
      options,
      submittedAnswer: '{"2":"Two","1":"One"}',
    })).toBe(true);
    expect(isPracticeAnswerCorrect({
      questionType: "matching",
      options,
      submittedAnswer: '{"1":"Two","2":"One"}',
    })).toBe(false);
  });
});
