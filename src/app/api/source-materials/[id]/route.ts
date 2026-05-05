import { NextResponse } from "next/server";
import { z } from "zod";
import { analysisToPayload } from "@/lib/analysis";
import { listKnowledgeAssetsByMaterial, syncSourceMaterialKnowledgeAsset } from "@/lib/knowledge-base";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  title: z.string().min(1).optional(),
  type: z.enum(["interview", "meeting", "business_context", "raw_requirements", "other"]).optional(),
  content: z.string().min(10).optional(),
});

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const material = await prisma.sourceMaterial.findUnique({
    where: { id },
    include: {
      analyses: { orderBy: { createdAt: "desc" }, take: 1 },
      documents: { orderBy: { updatedAt: "desc" } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!material) return NextResponse.json({ error: "Source material not found" }, { status: 404 });
  const knowledgeAssets = await listKnowledgeAssetsByMaterial(material.id);
  return NextResponse.json({
    material: {
      ...material,
      analyses: material.analyses.map((analysis) => ({
        id: analysis.id,
        ...analysisToPayload(analysis),
      })),
      knowledgeAssets,
      chunks: knowledgeAssets.flatMap((asset) => asset.chunks),
    },
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const payload = schema.parse(await request.json());
  const material = await prisma.sourceMaterial.update({ where: { id }, data: payload });
  await syncSourceMaterialKnowledgeAsset({
    sourceMaterialId: material.id,
    title: material.title,
    content: material.content,
    sourceType: material.source,
    fileName: material.fileName,
    mimeType: material.mimeType,
  });
  return NextResponse.json({ material });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await prisma.sourceMaterial.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
