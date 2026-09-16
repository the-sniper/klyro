import { describe, expect, it } from "vitest";
import { buildContext } from "./rag";
import type { MatchedChunk } from "@/types";

describe("buildContext", () => {
  it("returns a fallback message when no chunks match", () => {
    expect(buildContext([], new Map())).toBe(
      "No relevant information found in the knowledge base.",
    );
  });

  it("labels sources with document names and joins chunks", () => {
    const chunks: MatchedChunk[] = [
      {
        id: "c1",
        document_id: "d1",
        content: "Built AirLog for voice testing.",
        similarity: 0.91,
        metadata: {},
      },
      {
        id: "c2",
        document_id: "d2",
        content: "Shipped Klyro RAG widget.",
        similarity: 0.88,
        metadata: {},
      },
    ];
    const documentMap = new Map([
      ["d1", "Experience"],
      ["d2", "Projects"],
    ]);

    const context = buildContext(chunks, documentMap);

    expect(context).toContain("[Source 1: Experience]");
    expect(context).toContain("Built AirLog for voice testing.");
    expect(context).toContain("[Source 2: Projects]");
    expect(context).toContain("---");
  });

  it("falls back to General when document name is missing", () => {
    const chunks: MatchedChunk[] = [
      {
        id: "c1",
        document_id: "unknown",
        content: "orphan chunk",
        similarity: 0.5,
        metadata: {},
      },
    ];

    expect(buildContext(chunks, new Map())).toContain("[Source 1: General]");
  });
});
