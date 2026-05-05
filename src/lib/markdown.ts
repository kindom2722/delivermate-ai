import type { GeneratedDocument } from "@prisma/client";

export function exportDocumentFilename(document: Pick<GeneratedDocument, "title" | "type">) {
  const safeTitle = document.title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-")
    .replace(/^-|-$/g, "");

  return `${document.type.toLowerCase()}-${safeTitle || "document"}.md`;
}
