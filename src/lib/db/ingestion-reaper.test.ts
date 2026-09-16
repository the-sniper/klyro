import { beforeEach, describe, expect, it, vi } from "vitest";

const from = vi.fn();
const processDocument = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createServerClient: () => ({ from }),
}));

vi.mock("./documents", async () => {
  const actual = await vi.importActual<typeof import("./documents")>("./documents");
  return {
    ...actual,
    processDocument: (id: string) => processDocument(id),
  };
});

import { reapStalledDocuments } from "./ingestion-reaper";
import { MAX_INGESTION_ATTEMPTS } from "./documents";

interface StalledRow {
  id: string;
  name: string;
  attempts: number;
  processing_started_at: string;
}

/** Records every .update() payload while behaving like a Supabase query chain. */
function installSupabaseMock(stalled: StalledRow[]) {
  const updates: Array<{ id: string; payload: Record<string, unknown> }> = [];

  from.mockImplementation(() => {
    let pendingPayload: Record<string, unknown> | null = null;

    const chain: Record<string, unknown> = {
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve({ data: stalled, error: null }).then(resolve),
    };

    for (const method of ["select", "eq", "lt", "order", "limit"]) {
      chain[method] = vi.fn((...args: unknown[]) => {
        if (method === "eq" && pendingPayload) {
          updates.push({ id: String(args[1]), payload: pendingPayload });
          pendingPayload = null;
        }
        return chain;
      });
    }

    chain.update = vi.fn((payload: Record<string, unknown>) => {
      pendingPayload = payload;
      return chain;
    });

    return chain;
  });

  return updates;
}

describe("reapStalledDocuments", () => {
  beforeEach(() => {
    from.mockReset();
    processDocument.mockReset();
  });

  it("does nothing when no document is stalled", async () => {
    installSupabaseMock([]);

    const report = await reapStalledDocuments();

    expect(report.scanned).toBe(0);
    expect(report.outcomes).toEqual([]);
    expect(processDocument).not.toHaveBeenCalled();
  });

  it("retries a stalled document and counts the attempt", async () => {
    const updates = installSupabaseMock([
      { id: "doc-1", name: "Resume.pdf", attempts: 0, processing_started_at: "2026-01-01T00:00:00Z" },
    ]);
    processDocument.mockResolvedValue(undefined);

    const report = await reapStalledDocuments();

    expect(processDocument).toHaveBeenCalledWith("doc-1");
    expect(report.outcomes).toEqual([
      { documentId: "doc-1", name: "Resume.pdf", attempts: 1, result: "recovered" },
    ]);
    // The attempt is banked before the retry runs, so a second death cannot loop.
    expect(updates[0].payload).toMatchObject({ status: "queued", attempts: 1 });
  });

  it("reports a retry that fails again without looping", async () => {
    installSupabaseMock([
      { id: "doc-2", name: "Broken.md", attempts: 1, processing_started_at: "2026-01-01T00:00:00Z" },
    ]);
    processDocument.mockRejectedValue(new Error("url-scraper did not respond within 10000ms"));

    const report = await reapStalledDocuments();

    expect(report.outcomes[0]).toMatchObject({
      documentId: "doc-2",
      attempts: 2,
      result: "retry-failed",
      error: "url-scraper did not respond within 10000ms",
    });
  });

  it("fails a document permanently once the attempt budget is spent", async () => {
    const updates = installSupabaseMock([
      {
        id: "doc-3",
        name: "Cursed.pdf",
        attempts: MAX_INGESTION_ATTEMPTS,
        processing_started_at: "2026-01-01T00:00:00Z",
      },
    ]);

    const report = await reapStalledDocuments();

    expect(processDocument).not.toHaveBeenCalled();
    expect(report.outcomes[0]).toMatchObject({
      documentId: "doc-3",
      result: "failed-permanently",
    });
    expect(updates[0].payload).toMatchObject({
      status: "failed",
      error_message: `Ingestion stalled and did not complete after ${MAX_INGESTION_ATTEMPTS} attempts.`,
      processing_started_at: null,
    });
  });
});
