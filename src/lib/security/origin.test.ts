import { describe, expect, it } from "vitest";
import { checkOrigin, isUnrestricted } from "./origin";

describe("checkOrigin", () => {
  it("allows any origin when no domains are configured", () => {
    expect(checkOrigin("https://anywhere.example", [])).toEqual({ allowed: true });
    expect(checkOrigin(null, null)).toEqual({ allowed: true });
    expect(checkOrigin(null, ["   "])).toEqual({ allowed: true });
  });

  it("allows an exact domain match", () => {
    expect(checkOrigin("https://klyro.dev", ["klyro.dev"])).toEqual({ allowed: true });
  });

  it("allows subdomains of an allowed domain", () => {
    expect(checkOrigin("https://app.klyro.dev", ["klyro.dev"])).toEqual({
      allowed: true,
    });
  });

  it("ignores port, path and case", () => {
    expect(checkOrigin("http://Klyro.dev:3000", ["KLYRO.DEV"])).toEqual({
      allowed: true,
    });
  });

  it("accepts a wildcard prefix in configuration", () => {
    expect(checkOrigin("https://app.klyro.dev", ["*.klyro.dev"])).toEqual({
      allowed: true,
    });
  });

  it("rejects an unrelated domain", () => {
    expect(checkOrigin("https://evil.example", ["klyro.dev"])).toEqual({
      allowed: false,
      reason: "domain_not_allowed",
    });
  });

  it("rejects a domain that merely ends with the allowed one", () => {
    expect(checkOrigin("https://notklyro.dev", ["klyro.dev"])).toEqual({
      allowed: false,
      reason: "domain_not_allowed",
    });
  });

  it("fails closed when a restricted widget gets no Origin header", () => {
    expect(checkOrigin(null, ["klyro.dev"])).toEqual({
      allowed: false,
      reason: "missing_origin",
    });
    expect(checkOrigin("", ["klyro.dev"])).toEqual({
      allowed: false,
      reason: "missing_origin",
    });
  });

  it("rejects a malformed Origin instead of throwing", () => {
    expect(checkOrigin("not a url", ["klyro.dev"])).toEqual({
      allowed: false,
      reason: "domain_not_allowed",
    });
  });
});

describe("isUnrestricted", () => {
  it("is true only when nothing meaningful is configured", () => {
    expect(isUnrestricted(null)).toBe(true);
    expect(isUnrestricted([])).toBe(true);
    expect(isUnrestricted([" "])).toBe(true);
    expect(isUnrestricted(["klyro.dev"])).toBe(false);
  });
});
