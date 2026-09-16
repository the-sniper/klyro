import { describe, expect, it } from "vitest";
import { isAllowedFetchUrl, retrieveRelevantChunks } from "./rag";

const ALLOWED = ["https://klyro.dev", "https://areef.dev/portfolio"];

describe("isAllowedFetchUrl", () => {
  it("allows an exact match", () => {
    expect(isAllowedFetchUrl("https://klyro.dev", ALLOWED)).toBe(true);
  });

  it("allows any path when the allowed entry has no path", () => {
    expect(isAllowedFetchUrl("https://klyro.dev/pricing", ALLOWED)).toBe(true);
  });

  it("allows a path beneath an allowed path", () => {
    expect(isAllowedFetchUrl("https://areef.dev/portfolio/airlog", ALLOWED)).toBe(true);
  });

  it("ignores a trailing slash", () => {
    expect(isAllowedFetchUrl("https://areef.dev/portfolio/", ALLOWED)).toBe(true);
  });

  it("rejects a sibling path under the same host", () => {
    expect(isAllowedFetchUrl("https://areef.dev/admin", ALLOWED)).toBe(false);
  });

  it("rejects a path that merely shares a prefix string", () => {
    expect(isAllowedFetchUrl("https://areef.dev/portfolio-secrets", ALLOWED)).toBe(false);
  });

  it("rejects a different host", () => {
    expect(isAllowedFetchUrl("https://evil.example", ALLOWED)).toBe(false);
  });

  it("rejects a crafted url that merely contains an allowed url", () => {
    // The old substring check passed all of these.
    expect(
      isAllowedFetchUrl("https://evil.example/?next=https://klyro.dev", ALLOWED),
    ).toBe(false);
    expect(isAllowedFetchUrl("https://evil.example/https://klyro.dev", ALLOWED)).toBe(false);
    expect(isAllowedFetchUrl("https://klyro.dev.evil.example", ALLOWED)).toBe(false);
  });

  it("rejects a url that an allowed url contains", () => {
    // The old check also passed this direction.
    expect(isAllowedFetchUrl("https://areef.dev", ALLOWED)).toBe(false);
  });

  it("rejects non-http protocols", () => {
    expect(isAllowedFetchUrl("file:///etc/passwd", ["file:///etc"])).toBe(false);
    expect(isAllowedFetchUrl("data:text/html,hi", ALLOWED)).toBe(false);
  });

  it("rejects malformed input and empty allowlists", () => {
    expect(isAllowedFetchUrl("not a url", ALLOWED)).toBe(false);
    expect(isAllowedFetchUrl("https://klyro.dev", [])).toBe(false);
    expect(isAllowedFetchUrl("https://klyro.dev", ["also not a url"])).toBe(false);
  });

  it("matches hostnames case-insensitively", () => {
    expect(isAllowedFetchUrl("https://KLYRO.dev/x", ALLOWED)).toBe(true);
  });
});

describe("retrieveRelevantChunks tenant isolation", () => {
  it("refuses to search when no userId is given", async () => {
    await expect(retrieveRelevantChunks("anything")).rejects.toThrow(
      /requires a userId/,
    );
  });

  it("refuses an empty userId", async () => {
    await expect(retrieveRelevantChunks("anything", "")).rejects.toThrow(
      /requires a userId/,
    );
  });
});
