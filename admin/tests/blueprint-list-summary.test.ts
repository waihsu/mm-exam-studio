import { describe, expect, test } from "bun:test";
import { getBlueprintListOverview } from "../src/features/blueprints/blueprint-list-summary";
import type { PaperBlueprintListRow } from "../src/features/blueprints/types";

const row = (overrides: Partial<PaperBlueprintListRow>): PaperBlueprintListRow => ({
  id: "blueprint-1",
  title: "Sample blueprint",
  mode: "mcq_only",
  status: "draft",
  totalMarks: 50,
  availablePlanCodes: [],
  templateConfig: { isPublished: false },
  grade: { id: "g6", code: "G06", name: "Grade 6" },
  subject: { id: "math", code: "MATH", name: "Math" },
  generatedPaperCount: 0,
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("blueprint list overview", () => {
  test("counts ready, custom, and ungenerated non-ready blueprints", () => {
    expect(
      getBlueprintListOverview([
        row({ id: "one", status: "ready", generatedPaperCount: 3 }),
        row({ id: "two", mode: "custom" }),
        row({ id: "three", status: "archived", generatedPaperCount: 1 }),
      ]),
    ).toEqual({ total: 3, readyCount: 1, customCount: 1, issueCandidateCount: 1 });
  });
});
