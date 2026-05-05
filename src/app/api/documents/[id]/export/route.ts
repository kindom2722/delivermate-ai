import { prisma } from "@/lib/prisma";
import { exportDocumentFilename } from "@/lib/markdown";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const document = await prisma.generatedDocument.findUnique({ where: { id } });
  if (!document) return new Response("Document not found", { status: 404 });

  return new Response(document.content, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename="${encodeURIComponent(exportDocumentFilename(document))}"`,
    },
  });
}
