import { describe, expect, it } from "vitest";
import { assertSupportedUpload, normalizeExtractedText } from "./document-extract";

describe("document upload support", () => {
  it("accepts pdf and docx files", () => {
    expect(assertSupportedUpload("brief.pdf", "application/pdf")).toEqual({ kind: "pdf" });
    expect(
      assertSupportedUpload(
        "requirements.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    ).toEqual({ kind: "docx" });
  });

  it("rejects legacy doc files with a clear message", () => {
    expect(() => assertSupportedUpload("legacy.doc", "application/msword")).toThrow(".docx");
  });
});

describe("normalizeExtractedText", () => {
  it("collapses excessive blank lines and trims whitespace", () => {
    expect(normalizeExtractedText("  Line 1\r\n\r\n\r\nLine 2  \n\n\nLine 3  ")).toBe(
      "Line 1\n\nLine 2\n\nLine 3",
    );
  });
});
