import { describe, expect, test } from "bun:test";
import {
  DEFAULT_QUESTION_PAGE,
  DEFAULT_QUESTION_PAGE_SIZE,
  toQuestionFilters,
  toQuestionListSearch,
  validateQuestionListSearch,
} from "../src/features/questions/question-list-search";

describe("question list search utilities", () => {
  test("maps URL values into API filters with safe defaults", () => {
    expect(
      toQuestionFilters({
        search: "  algebra  ",
        gradeId: "grade-7",
        type: "mcq",
        mode: "variable",
        isPublished: "false",
      }),
    ).toEqual({
      search: "  algebra  ",
      gradeId: "grade-7",
      subjectId: undefined,
      chapterId: undefined,
      subChapterId: undefined,
      type: "mcq",
      mode: "variable",
      difficulty: undefined,
      isPublished: false,
      page: DEFAULT_QUESTION_PAGE,
      pageSize: DEFAULT_QUESTION_PAGE_SIZE,
    });
  });

  test("removes default pagination from shareable URLs", () => {
    expect(
      toQuestionListSearch({
        search: "algebra",
        page: DEFAULT_QUESTION_PAGE,
        pageSize: DEFAULT_QUESTION_PAGE_SIZE,
      }),
    ).toEqual({ search: "algebra" });
  });

  test("rejects unknown query parameters and malformed pagination", () => {
    expect(
      validateQuestionListSearch({
        type: "essay",
        mode: "unexpected",
        difficulty: "expert",
        isPublished: "maybe",
        page: "not-a-number",
        pageSize: "50",
      }),
    ).toEqual({
      search: undefined,
      gradeId: undefined,
      subjectId: undefined,
      chapterId: undefined,
      subChapterId: undefined,
      type: undefined,
      mode: undefined,
      difficulty: undefined,
      isPublished: undefined,
      page: DEFAULT_QUESTION_PAGE,
      pageSize: 50,
    });
  });
});
