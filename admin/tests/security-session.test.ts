import { describe, expect, it } from "bun:test";
import {
  formatDeviceLabel,
  isExpiringSoon,
  normalizeDeviceText,
} from "../src/features/settings/utils/security-session";

describe("security session utilities", () => {
  it("turns user-agent strings into concise device labels", () => {
    expect(
      formatDeviceLabel(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit Chrome/120.0",
        "desktop",
      ),
    ).toBe("Windows · Chrome");
    expect(formatDeviceLabel("", "mobile")).toBe("Mobile device");
  });

  it("normalizes whitespace and only flags future sessions in the next 24 hours", () => {
    expect(normalizeDeviceText("  Android   Chrome  ")).toBe("Android Chrome");

    const now = Date.parse("2026-09-04T00:00:00.000Z");
    expect(isExpiringSoon("2026-09-04T12:00:00.000Z", now)).toBe(true);
    expect(isExpiringSoon("2026-09-06T00:00:00.000Z", now)).toBe(false);
    expect(isExpiringSoon("2026-09-03T12:00:00.000Z", now)).toBe(false);
  });
});
