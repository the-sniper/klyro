import { describe, expect, it } from "vitest";
import { chunkDocument, generateEmbedding, generateEmbeddings } from "./embeddings";

describe("chunkDocument", () => {
  it("returns a single trimmed chunk for short content", () => {
    expect(chunkDocument("  hello world  ")).toEqual(["hello world"]);
  });

  it("splits long content into overlapping chunks", () => {
    const content = "A".repeat(5000);
    const chunks = chunkDocument(content);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.length > 0)).toBe(true);
  });

  it("prefers sentence boundaries when available", () => {
    const sentences = Array.from(
      { length: 80 },
      (_, i) =>
        `Sentence number ${i + 1} elaborates on a longer thought for chunking.`,
    ).join(" ");
    const chunks = chunkDocument(sentences);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.some((c) => c.trimEnd().endsWith("."))).toBe(true);
  });
});

describe("generateEmbedding validation", () => {
  it("rejects null/undefined input", async () => {
    await expect(generateEmbedding(null as unknown as string)).rejects.toThrow(
      /non-empty string/,
    );
  });

  it("rejects whitespace-only input", async () => {
    await expect(generateEmbedding("   ")).rejects.toThrow(/cannot be empty/);
  });
});

describe("generateEmbeddings validation", () => {
  it("returns empty array for empty input", async () => {
    await expect(generateEmbeddings([])).resolves.toEqual([]);
  });

  it("rejects arrays containing empty strings", async () => {
    await expect(generateEmbeddings(["ok", "  "])).rejects.toThrow(/index 1/);
  });
});
