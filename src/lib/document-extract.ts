import mammoth from "mammoth";
import { extractText } from "unpdf";

export function normalizeExtractedText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extensionOf(fileName: string) {
  return fileName.toLowerCase().split(".").pop() ?? "";
}

export function assertSupportedUpload(fileName: string, mimeType: string) {
  const extension = extensionOf(fileName);
  const isPdf = extension === "pdf" || mimeType === "application/pdf";
  const isDocx =
    extension === "docx" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const isLegacyDoc = extension === "doc" || mimeType === "application/msword";

  if (isPdf || isDocx) {
    return { kind: isPdf ? "pdf" : "docx" } as const;
  }

  if (isLegacyDoc) {
    throw new Error("当前仅支持解析 PDF 和 DOCX。请先将 .doc 另存为 .docx 后再上传。");
  }

  throw new Error("仅支持上传 PDF 或 Word 文档（.docx）。");
}

export async function extractDocumentText(file: File) {
  const format = assertSupportedUpload(file.name, file.type);
  const buffer = Buffer.from(await file.arrayBuffer());

  if (format.kind === "pdf") {
    const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });
    const content = normalizeExtractedText(text);
    if (!content) {
      throw new Error("PDF 解析完成，但没有提取到可用文本。");
    }
    return content;
  }

  const result = await mammoth.extractRawText({ buffer });
  const content = normalizeExtractedText(result.value);
  if (!content) {
    throw new Error("Word 文档解析完成，但没有提取到可用文本。");
  }
  return content;
}
