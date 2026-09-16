import { describe, expect, it } from "vitest";
import { decodeHtmlEntities } from "./html-entities";

describe("decodeHtmlEntities", () => {
  it("decodes the entity that was corrupting stored chunks", () => {
    expect(decodeHtmlEntities("Calm &amp; Thoughtful")).toBe("Calm & Thoughtful");
  });

  it("decodes the common named entities", () => {
    expect(decodeHtmlEntities("&lt;div&gt; &quot;x&quot; &apos;y&apos;")).toBe(
      "<div> \"x\" 'y'",
    );
    expect(decodeHtmlEntities("a&nbsp;b")).toBe("a b");
    expect(decodeHtmlEntities("it&rsquo;s")).toBe("it’s");
  });

  it("decodes decimal and hexadecimal references", () => {
    expect(decodeHtmlEntities("&#39;quoted&#39;")).toBe("'quoted'");
    expect(decodeHtmlEntities("&#x2014;")).toBe("—");
    expect(decodeHtmlEntities("&#128640;")).toBe("\u{1F680}");
  });

  it("leaves unknown entities untouched rather than mangling them", () => {
    expect(decodeHtmlEntities("&notarealentity; stays")).toBe("&notarealentity; stays");
    expect(decodeHtmlEntities("Q&A about R&D")).toBe("Q&A about R&D");
  });

  it("rejects out-of-range and surrogate code points", () => {
    expect(decodeHtmlEntities("&#xD800;")).toBe("&#xD800;");
    expect(decodeHtmlEntities("&#1114112;")).toBe("&#1114112;");
    expect(decodeHtmlEntities("&#0;")).toBe("&#0;");
  });

  it("returns the input untouched when there is nothing to decode", () => {
    expect(decodeHtmlEntities("plain text")).toBe("plain text");
    expect(decodeHtmlEntities("")).toBe("");
  });

  it("decodes a double-encoded ampersand only one level", () => {
    // &amp;amp; is a literal "&amp;" that was encoded once; one pass is correct.
    expect(decodeHtmlEntities("&amp;amp;")).toBe("&amp;");
  });
});
