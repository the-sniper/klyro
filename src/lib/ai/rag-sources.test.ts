import { describe, expect, it } from "vitest";
import { buildSourceReferences } from "./rag";
import type { MatchedChunk } from "@/types";

function chunk(
  documentId: string,
  similarity: number,
  content = "some chunk text",
): MatchedChunk {
  return {
    id: `${documentId}-${similarity}`,
    document_id: documentId,
    content,
    similarity,
    metadata: {},
  };
}

const documentMap = new Map([
  ["doc-a", "Resume.pdf"],
  ["doc-b", "Projects.md"],
  ["doc-c", "About.md"],
]);

describe("buildSourceReferences", () => {
  it("returns nothing when no chunks were retrieved", () => {
    expect(buildSourceReferences([], documentMap)).toEqual([]);
  });

  it("collapses many chunks of one document into its best chunk", () => {
    const sources = buildSourceReferences(
      [chunk("doc-a", 0.38, "weaker"), chunk("doc-a", 0.42, "stronger")],
      documentMap,
    );

    expect(sources).toHaveLength(1);
    expect(sources[0]).toMatchObject({
      document_id: "doc-a",
      document_name: "Resume.pdf",
      chunk_content: "stronger",
      similarity: 0.42,
    });
  });

  it("orders documents by their best similarity", () => {
    const sources = buildSourceReferences(
      [chunk("doc-a", 0.31), chunk("doc-b", 0.40), chunk("doc-c", 0.35)],
      documentMap,
    );

    expect(sources.map((s) => s.document_id)).toEqual(["doc-b", "doc-c", "doc-a"]);
  });

  it("drops chunks far below the best match", () => {
    const sources = buildSourceReferences(
      [chunk("doc-a", 0.5), chunk("doc-b", 0.2)],
      documentMap,
    );

    expect(sources.map((s) => s.document_id)).toEqual(["doc-a"]);
  });

  it("keeps a tight cluster even when absolute scores are low", () => {
    // Real distribution for "are you available for freelance work?"
    const sources = buildSourceReferences(
      [chunk("doc-a", 0.279), chunk("doc-b", 0.268), chunk("doc-c", 0.232)],
      documentMap,
    );

    expect(sources).toHaveLength(3);
  });

  it("drops everything below the absolute floor", () => {
    expect(
      buildSourceReferences([chunk("doc-a", 0.12), chunk("doc-b", 0.1)], documentMap),
    ).toEqual([]);
  });

  it("caps the list at four documents", () => {
    const sources = buildSourceReferences(
      [
        chunk("doc-a", 0.5),
        chunk("doc-b", 0.49),
        chunk("doc-c", 0.48),
        chunk("doc-d", 0.47),
        chunk("doc-e", 0.46),
      ],
      documentMap,
    );

    expect(sources).toHaveLength(4);
  });

  it("truncates long excerpts and labels unknown documents", () => {
    const [source] = buildSourceReferences(
      [chunk("doc-missing", 0.4, "x".repeat(250))],
      documentMap,
    );

    expect(source.document_name).toBe("Unknown");
    expect(source.chunk_content).toHaveLength(203);
    expect(source.chunk_content.endsWith("...")).toBe(true);
  });
});
