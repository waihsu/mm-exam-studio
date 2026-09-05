import { describe, expect, test } from "bun:test";
import { parseMathRichTextSegments } from "../src/ui/math/math-rich-text";

describe("MathRichText segmentation", () => {
  test("keeps inline math in the same text flow", () => {
    expect(parseMathRichTextSegments("Solve for $x$: $x + 7 = 19$.")).toEqual([
      { type: "text", value: "Solve for " },
      { type: "math", value: "x", displayMode: false },
      { type: "text", value: ": " },
      { type: "math", value: "x + 7 = 19", displayMode: false },
      { type: "text", value: "." },
    ]);
  });

  test("marks double-dollar expressions as display math", () => {
    expect(parseMathRichTextSegments("Work:\n$$x = 12$$")).toEqual([
      { type: "text", value: "Work:\n" },
      { type: "math", value: "x = 12", displayMode: true },
    ]);
  });
});
