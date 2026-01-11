import { describe, it, expect } from "vitest";
import { escapeHtml, safeDataUrl } from "./template.js";

describe("escapeHtml", () => {
  it("escapes ampersand", () => {
    expect(escapeHtml("foo & bar")).toBe("foo &amp; bar");
  });

  it("escapes less than", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes greater than", () => {
    expect(escapeHtml("a > b")).toBe("a &gt; b");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('class="test"')).toBe("class=&quot;test&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });

  it("escapes multiple special characters together", () => {
    expect(escapeHtml('<a href="test">Tom & Jerry\'s</a>')).toBe(
      "&lt;a href=&quot;test&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;"
    );
  });

  it("handles empty string", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("returns unchanged string with no special characters", () => {
    expect(escapeHtml("Hello World 123")).toBe("Hello World 123");
  });

  it("handles Polish characters unchanged", () => {
    expect(escapeHtml("ąćęłńóśźżĄĆĘŁŃÓŚŹŻ")).toBe("ąćęłńóśźżĄĆĘŁŃÓŚŹŻ");
  });
});

describe("safeDataUrl", () => {
  it("returns valid PNG data URL unchanged", () => {
    const url = "data:image/png;base64,iVBORw0KGgo=";
    expect(safeDataUrl(url)).toBe(url);
  });

  it("returns null for null input", () => {
    expect(safeDataUrl(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(safeDataUrl("")).toBeNull();
  });

  it("rejects javascript: URL", () => {
    expect(safeDataUrl("javascript:alert(1)")).toBeNull();
  });

  it("rejects data URL with wrong MIME type", () => {
    expect(safeDataUrl("data:text/html;base64,PHNjcmlwdD4=")).toBeNull();
  });

  it("rejects http URL", () => {
    expect(safeDataUrl("https://example.com/image.png")).toBeNull();
  });

  it("rejects data URL without base64 encoding", () => {
    expect(safeDataUrl("data:image/png,rawdata")).toBeNull();
  });
});
