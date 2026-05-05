import { NextResponse } from "next/server";
import { z } from "zod";
import { getAIProvider, getAIProviderLabel } from "@/lib/ai/provider";
import { payloadToAnalysisData } from "@/lib/analysis";
import { syncSourceMaterialKnowledgeAsset } from "@/lib/knowledge-base";
import { prisma } from "@/lib/prisma";

const schema = z.object({ sourceMaterialId: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const { sourceMaterialId } = schema.parse(await request.json());
    const material = await prisma.sourceMaterial.findUnique({ where: { id: sourceMaterialId } });
    if (!material) return NextResponse.json({ error: "Source material not found" }, { status: 404 });

    await syncSourceMaterialKnowledgeAsset({
      sourceMaterialId: material.id,
      title: material.title,
      content: material.content,
      sourceType: material.source,
      fileName: material.fileName,
      mimeType: material.mimeType,
    });

    const provider = getAIProvider();
    const providerLabel = getAIProviderLabel();
    const payload = await provider.analyzeMaterial({
      title: material.title,
      type: material.type as never,
      content: material.content,
    });
    const analysis = await prisma.analysisResult.create({
      data: { sourceMaterialId: material.id, ...payloadToAnalysisData(payload) },
    });
    return NextResponse.json({ analysis, payload, providerLabel }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown analyze-material error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
