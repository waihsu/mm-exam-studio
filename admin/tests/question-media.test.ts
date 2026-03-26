import { describe, expect, it } from "bun:test";
import { normalizeMediaUrls } from "../src/features/questions/components/question-form.helpers";

describe("normalizeMediaUrls", () => {
  it("trims, deduplicates, and limits to 4 URLs", () => {
    const normalized = normalizeMediaUrls([
      " https://a.test/1.png ",
      "https://a.test/1.png",
      "https://a.test/2.png",
      "https://a.test/3.png",
      "https://a.test/4.png",
      "https://a.test/5.png",
      " ",
    ]);

    expect(normalized).toEqual([
      "https://a.test/1.png",
      "https://a.test/2.png",
      "https://a.test/3.png",
      "https://a.test/4.png",
    ]);
  });
});
