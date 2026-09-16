import { describe, expect, it } from "vitest";
import {
  computeContentHash,
  MAX_INGESTION_ATTEMPTS,
  STALLED_AFTER_MS,
} from "./documents";

describe("computeContentHash", () => {
  it("matches the known SHA-256 of a string", async () => {
    expect(await computeContentHash("hello")).toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
  });

  it("is stable for identical content", async () => {
    const content = "Areef builds Klyro, an AI portfolio assistant.";
    expect(await computeContentHash(content)).toBe(await computeContentHash(content));
  });

  it("changes when the content changes", async () => {
    expect(await computeContentHash("a")).not.toBe(await computeContentHash("b"));
  });

  it("handles multi-byte characters", async () => {
    await expect(computeContentHash("café — naïve")).resolves.toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("ingestion durability constants", () => {
  it("considers a document stalled after ten minutes", () => {
    expect(STALLED_AFTER_MS).toBe(10 * 60 * 1000);
  });

  it("retries at most three times", () => {
    expect(MAX_INGESTION_ATTEMPTS).toBe(3);
  });
});
