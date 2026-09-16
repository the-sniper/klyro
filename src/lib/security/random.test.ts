import { describe, expect, it } from "vitest";
import {
  generateOtpCode,
  generateWidgetKey,
  OTP_DIGITS,
  WIDGET_KEY_LENGTH,
} from "./random";

describe("generateWidgetKey", () => {
  it("returns 12 characters from the expected alphabet", () => {
    const key = generateWidgetKey();
    expect(key).toHaveLength(WIDGET_KEY_LENGTH);
    expect(key).toMatch(/^[A-Za-z0-9]{12}$/);
  });

  it("does not repeat across many draws", () => {
    const keys = new Set(Array.from({ length: 2000 }, () => generateWidgetKey()));
    expect(keys.size).toBe(2000);
  });

  it("uses the whole alphabet, not a biased slice", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 500; i++) {
      for (const char of generateWidgetKey()) seen.add(char);
    }
    // 62 possible characters; 6000 draws should cover essentially all of them.
    expect(seen.size).toBeGreaterThan(58);
  });
});

describe("generateOtpCode", () => {
  it("always returns six digits, including codes with leading zeros", () => {
    for (let i = 0; i < 500; i++) {
      expect(generateOtpCode()).toMatch(/^\d{6}$/);
    }
  });

  it("respects the configured length", () => {
    expect(generateOtpCode(OTP_DIGITS)).toHaveLength(OTP_DIGITS);
    expect(generateOtpCode(8)).toHaveLength(8);
  });

  it("spreads across the full range rather than clustering", () => {
    const codes = Array.from({ length: 1000 }, () => Number(generateOtpCode()));
    expect(Math.min(...codes)).toBeLessThan(200000);
    expect(Math.max(...codes)).toBeGreaterThan(800000);
  });
});
