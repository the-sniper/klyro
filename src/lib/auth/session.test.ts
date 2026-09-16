import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSessionToken,
  encodeSession,
  parseSession,
  SESSION_MAX_AGE_SECONDS,
} from "./session";

const SECRET = "test-session-secret-at-least-32-chars-long";
const OTHER_SECRET = "a-completely-different-secret-also-32-chars";

/** Mint a cookie in the old unsigned format: base64(JSON), no signature. */
function forgeLegacyCookie(payload: object): string {
  return btoa(JSON.stringify(payload));
}

describe("session cookies", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = SECRET;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("round-trips a valid session", async () => {
    const payload = {
      userId: "user-1",
      email: "areef@example.com",
      exp: Date.now() + 60_000,
    };

    const cookie = await encodeSession(payload);
    expect(await parseSession(cookie)).toEqual(payload);
  });

  it("createSessionToken sets a 7-day expiry", async () => {
    const before = Date.now();
    const cookie = await createSessionToken("user-1", "areef@example.com");
    const parsed = await parseSession(cookie);

    expect(parsed?.userId).toBe("user-1");
    expect(parsed?.exp).toBeGreaterThanOrEqual(
      before + SESSION_MAX_AGE_SECONDS * 1000,
    );
  });

  it("returns null for a missing cookie", async () => {
    expect(await parseSession(undefined)).toBeNull();
  });

  it("returns null for a malformed cookie", async () => {
    expect(await parseSession("not-valid-base64!!!")).toBeNull();
    expect(await parseSession(".")).toBeNull();
    expect(await parseSession("payload-with-no-signature.")).toBeNull();
  });

  it("returns null for an expired session", async () => {
    const cookie = await encodeSession({
      userId: "user-1",
      email: "areef@example.com",
      exp: Date.now() - 1,
    });

    expect(await parseSession(cookie)).toBeNull();
  });

  it("rejects a hand-crafted unsigned cookie in the old base64 format", async () => {
    const forged = forgeLegacyCookie({
      userId: "victim-user-id",
      email: "victim@example.com",
      exp: Date.now() + 60_000,
    });

    expect(await parseSession(forged)).toBeNull();
  });

  it("rejects a forged payload bolted onto a garbage signature", async () => {
    const forged = `${forgeLegacyCookie({
      userId: "victim-user-id",
      email: "victim@example.com",
      exp: Date.now() + 60_000,
    })}.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`;

    expect(await parseSession(forged)).toBeNull();
  });

  it("rejects a tampered payload carrying a previously valid signature", async () => {
    const cookie = await encodeSession({
      userId: "user-1",
      email: "areef@example.com",
      exp: Date.now() + 60_000,
    });
    const signature = cookie.slice(cookie.indexOf(".") + 1);

    const swappedPayload = btoa(
      JSON.stringify({
        userId: "victim-user-id",
        email: "victim@example.com",
        exp: Date.now() + 60_000,
      }),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    expect(await parseSession(`${swappedPayload}.${signature}`)).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const cookie = await encodeSession({
      userId: "user-1",
      email: "areef@example.com",
      exp: Date.now() + 60_000,
    });

    process.env.SESSION_SECRET = OTHER_SECRET;
    expect(await parseSession(cookie)).toBeNull();
  });

  it("fails closed when SESSION_SECRET is missing", async () => {
    const cookie = await encodeSession({
      userId: "user-1",
      email: "areef@example.com",
      exp: Date.now() + 60_000,
    });

    vi.spyOn(console, "error").mockImplementation(() => {});
    delete process.env.SESSION_SECRET;

    expect(await parseSession(cookie)).toBeNull();
    await expect(
      encodeSession({ userId: "u", email: "e", exp: Date.now() + 1000 }),
    ).rejects.toThrow(/SESSION_SECRET/);
  });

  it("fails closed when SESSION_SECRET is too short to key an HMAC", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.SESSION_SECRET = "too-short";

    expect(await parseSession("anything.anything")).toBeNull();
  });
});
