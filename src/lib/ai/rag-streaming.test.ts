import { describe, expect, it } from "vitest";
import { scrubDashes } from "./rag";

/** Split a string into chunks of pseudo-random length, like the API does. */
function splitIntoDeltas(text: string, seed: number): string[] {
  const deltas: string[] = [];
  let index = 0;
  let cursor = seed;

  while (index < text.length) {
    cursor = (cursor * 1103515245 + 12345) % 2147483648;
    const size = 1 + (cursor % 5);
    deltas.push(text.slice(index, index + size));
    index += size;
  }

  return deltas;
}

describe("scrubDashes", () => {
  it("replaces em-dashes with a comma and space", () => {
    expect(scrubDashes("fast—and cheap")).toBe("fast, and cheap");
  });

  it("replaces en-dashes with a hyphen", () => {
    expect(scrubDashes("2019–2024")).toBe("2019-2024");
  });

  it("leaves text without typographic dashes untouched", () => {
    expect(scrubDashes("plain - hyphen")).toBe("plain - hyphen");
  });

  it("is idempotent", () => {
    const once = scrubDashes("a—b–c");
    expect(scrubDashes(once)).toBe(once);
  });

  it("never lets a dash through when applied per delta", () => {
    const answer =
      "He builds things—fast—and shipped 2019–2024. —Leading dash, trailing—";

    for (let seed = 1; seed <= 25; seed++) {
      const streamed = splitIntoDeltas(answer, seed).map(scrubDashes).join("");

      expect(streamed).not.toContain("—");
      expect(streamed).not.toContain("–");
      // The text we would persist is identical to what the client received,
      // which is why no lookbehind buffer is needed.
      expect(streamed).toBe(scrubDashes(answer));
    }
  });

  it("handles a delta that is nothing but a dash", () => {
    expect(["fast", "—", "cheap"].map(scrubDashes).join("")).toBe("fast, cheap");
  });
});
