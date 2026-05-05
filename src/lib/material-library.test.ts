import { describe, expect, it } from "vitest";
import { appendLibraryContent, chooseLibraryFileName } from "./material-library";

describe("appendLibraryContent", () => {
  it("returns incoming content when the library is empty", () => {
    expect(appendLibraryContent("", "brief.pdf", "Hello")).toBe("Hello");
  });

  it("appends a file heading when the library already has content", () => {
    expect(appendLibraryContent("Existing", "brief.pdf", "Hello")).toContain("## 来源文件：brief.pdf");
  });
});

describe("chooseLibraryFileName", () => {
  it("keeps a single file name when there is only one file", () => {
    expect(chooseLibraryFileName(null, "a.docx")).toBe("a.docx");
  });

  it("clears the single file name when the library has multiple files", () => {
    expect(chooseLibraryFileName("a.docx", "b.docx")).toBeNull();
  });
});
