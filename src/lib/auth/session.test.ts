import { describe, expect, it } from "vitest";
import { encodeSession, parseSession } from "./session";

describe("parseSession / encodeSession", () => {
  it("round-trips a valid session", () => {
    const payload = {
      userId: "user-1",
      email: "areef@example.com",
      exp: Date.now() + 60_000,
    };

    const cookie = encodeSession(payload);
    const parsed = parseSession(cookie);

    expect(parsed).toEqual(payload);
  });

  it("returns null for missing cookie", () => {
    expect(parseSession(undefined)).toBeNull();
  });

  it("returns null for malformed base64/JSON", () => {
    expect(parseSession("not-valid-base64!!!")).toBeNull();
  });

  it("returns null for expired sessions", () => {
    const cookie = encodeSession({
      userId: "user-1",
      email: "areef@example.com",
      exp: Date.now() - 1,
    });

    expect(parseSession(cookie)).toBeNull();
  });
});
