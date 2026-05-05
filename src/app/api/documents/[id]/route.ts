import { NextResponse } from "next/server";
import { z } from "zod";
import { syncGeneratedDocumentKnowledgeAsset } from "@/lib/knowledge-base";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const payload = schema.parse(await request.json());
  const document = await prisma.generatedDocument.update({ where: { id }, data: payload });
  await syncGeneratedDocumentKnowledgeAsset({
    generatedDocumentId: document.id,
    sourceMaterialId: document.sourceMaterialId,
    title: document.title,
    content: document.content,
    format: document.format,
    sourceType: document.type,
  });
  return NextResponse.json({ document });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await prisma.generatedDocument.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
