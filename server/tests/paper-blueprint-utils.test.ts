import { describe, expect, test } from "bun:test";
import {
  allocateDifficultyCounts,
  normalizePresetConfig,
  normalizeTemplateConfig,
} from "../src/modules/workspace/services/paper-blueprint.utils";

describe("paper blueprint utility rules", () => {
  test("allocates every question while preserving the closest difficulty distribution", () => {
    const allocation = allocateDifficultyCounts(7, {
      easy: 30,
      normal: 40,
      hard: 20,
      advance: 10,
    });

    expect(allocation).toEqual({ easy: 2, normal: 3, hard: 1, advance: 1 });
    expect(Object.values(allocation).reduce((total, count) => total + count, 0)).toBe(7);
  });

  test("keeps only usable chapter and lesson identifiers in preset configuration", () => {
    expect(
      normalizePresetConfig({
        chapterIds: ["chapter-1", "", 42, "chapter-1"],
        subChapterIds: ["lesson-1", null, "lesson-2"],
      }),
    ).toEqual({
      chapterIds: ["chapter-1", "chapter-1"],
      subChapterIds: ["lesson-1", "lesson-2"],
    });
  });

  test("accepts only supported template plan codes", () => {
    expect(
      normalizeTemplateConfig({
        isPublished: true,
        availablePlanCodes: ["free", "premium", "enterprise", "free"],
      }),
    ).toEqual({ isPublished: true, availablePlanCodes: ["free", "premium"] });
  });
});
