import type { AnalysisPayload } from "@/lib/ai/types";
import { analysisToPayload } from "@/lib/analysis";
import { listKnowledgeAssetsByMaterial } from "@/lib/knowledge-base";
import { prisma } from "@/lib/prisma";

export type KnowledgeChunkDTO = {
  id: string;
  ordinal: number;
  text: string;
  keywords: string[];
};

export type KnowledgeAssetDTO = {
  id: string;
  sourceMaterialId: string;
  generatedDocumentId: string | null;
  category: string;
  title: string;
  content: string;
  sourceType: string;
  fileName: string | null;
  mimeType: string | null;
  format: string;
  chunks: KnowledgeChunkDTO[];
};

export type MaterialDTO = {
  id: string;
  title: string;
  type: string;
  content: string;
  fileName?: string | null;
  mimeType?: string | null;
  source?: string;
  analyses: Array<{ id: string } & AnalysisPayload>;
  documents: Array<{ id: string; title: string; type: string; content: string }>;
  messages: Array<{ id: string; role: string; content: string }>;
  knowledgeAssets: KnowledgeAssetDTO[];
  chunks: KnowledgeChunkDTO[];
};

export async function getWorkspaceMaterials(): Promise<MaterialDTO[]> {
  const materials = await prisma.sourceMaterial.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      analyses: { orderBy: { createdAt: "desc" }, take: 1 },
      documents: { orderBy: { updatedAt: "desc" } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  return Promise.all(
    materials.map(async (material) => {
      const knowledgeAssets = await listKnowledgeAssetsByMaterial(material.id);
      return {
        id: material.id,
        title: material.title,
        type: material.type,
        content: material.content,
        fileName: material.fileName,
        mimeType: material.mimeType,
        source: material.source,
        analyses: material.analyses.map((analysis) => ({
          id: analysis.id,
          ...analysisToPayload(analysis),
        })),
        documents: material.documents.map((document) => ({
          id: document.id,
          title: document.title,
          type: document.type,
          content: document.content,
        })),
        messages: material.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
        })),
        knowledgeAssets,
        chunks: knowledgeAssets.flatMap((asset) => asset.chunks),
      };
    }),
  );
}
