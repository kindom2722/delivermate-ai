import { NextResponse } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@/lib/ai/provider";
import { analysisToPayload, payloadToAnalysisData } from "@/lib/analysis";
import { documentTypeLabels } from "@/lib/document-labels";
import { syncGeneratedDocumentKnowledgeAsset, syncSourceMaterialKnowledgeAsset } from "@/lib/knowledge-base";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  sourceMaterialId: z.string().min(1),
  documentType: z.enum(["requirements_doc", "function_list", "test_cases", "uat_table", "training_manual"]),
});

function shouldRefreshAnalysis(summary: string | undefined) {
  if (!summary) return true;

  return (
    summary.includes("DeepSeek 未能稳定返回合法 JSON") ||
    summary.includes("DeepSeek 分析失败，已回退为本地草稿")
  );
}

export async function POST(request: Request) {
  try {
    const { sourceMaterialId, documentType } = schema.parse(await request.json());
    const material = await prisma.sourceMaterial.findUnique({
      where: { id: sourceMaterialId },
      include: { analyses: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
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
    let analysis = material.analyses[0];
    if (!analysis || shouldRefreshAnalysis(analysis.summary)) {
      const payload = await provider.analyzeMaterial({
        title: material.title,
        type: material.type as never,
        content: material.content,
      });
      analysis = await prisma.analysisResult.create({
        data: { sourceMaterialId: material.id, ...payloadToAnalysisData(payload) },
      });
    }

    const payload = analysisToPayload(analysis);
    const content = await provider.generateDocument({
      documentType,
      materialTitle: material.title,
      materialContent: material.content,
      analysis: payload,
    });
    const document = await prisma.generatedDocument.create({
      data: {
        sourceMaterialId: material.id,
        analysisResultId: analysis.id,
        type: documentType,
        title: `${material.title} - ${documentTypeLabels[documentType]}`,
        content,
        format: "markdown",
      },
    });

    await syncGeneratedDocumentKnowledgeAsset({
      generatedDocumentId: document.id,
      sourceMaterialId: material.id,
      title: document.title,
      content: document.content,
      format: document.format,
      sourceType: document.type,
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generate-document error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
