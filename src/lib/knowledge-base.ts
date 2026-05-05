import crypto from "node:crypto";
import { prisma } from "./prisma";
import { extractKeywords, parseKeywords, splitIntoKnowledgeChunks } from "./rag";

export type KnowledgeAssetCategory = "generated_document" | `submission:${string}`;

export type KnowledgeAssetDTO = {
  id: string;
  sourceMaterialId: string;
  generatedDocumentId: string | null;
  category: KnowledgeAssetCategory;
  title: string;
  content: string;
  sourceType: string;
  fileName: string | null;
  mimeType: string | null;
  format: string;
  createdAt: Date;
  updatedAt: Date;
  chunks: Array<{
    id: string;
    ordinal: number;
    text: string;
    keywords: string[];
  }>;
};

export type RetrievedKnowledgeMatch = {
  assetId: string;
  assetTitle: string;
  category: KnowledgeAssetCategory;
  sourceType: string;
  ordinal: number;
  text: string;
  keywords: string[];
  score: number;
};

export const manualSubmissionCategory = "submission:manual";
export const manualSubmissionKey = "manual";

export function createUploadSubmissionKey() {
  return crypto.randomUUID();
}

export function createUploadSubmissionCategory(submissionKey = createUploadSubmissionKey()) {
  return `submission:file:${submissionKey}` as const;
}

export function isSubmissionCategory(category: string): category is `submission:${string}` {
  return category.startsWith("submission:");
}

function resolveChunkKeywords(rawKeywords: string, text: string) {
  return extractKeywords([...(parseKeywords(rawKeywords) ?? []), text].join(" "), 8);
}

function scoreText(query: string, text: string, keywords: string[]) {
  const queryKeywords = extractKeywords(query, 12);
  if (!queryKeywords.length) return 0;

  const normalized = text.toLowerCase();
  let score = 0;
  for (const token of queryKeywords) {
    if (keywords.includes(token)) score += 6 + Math.min(token.length, 4);
    score += (normalized.split(token.toLowerCase()).length - 1) * Math.min(token.length, 4);
  }
  return score;
}

async function replaceAssetChunks(knowledgeAssetId: string, content: string) {
  const chunks = splitIntoKnowledgeChunks(content).map((chunk) => ({
    knowledgeAssetId,
    ordinal: chunk.ordinal,
    text: chunk.text,
    keywords: JSON.stringify(chunk.keywords),
  }));

  await prisma.$transaction([
    prisma.knowledgeChunk.deleteMany({ where: { knowledgeAssetId } }),
    ...(chunks.length ? [prisma.knowledgeChunk.createMany({ data: chunks })] : []),
  ]);
}

export async function syncSourceMaterialKnowledgeAsset(input: {
  sourceMaterialId: string;
  title: string;
  content: string;
  sourceType: string;
  fileName?: string | null;
  mimeType?: string | null;
  category?: `submission:${string}`;
  submissionKey?: string;
  createOnly?: boolean;
}) {
  const category = input.category ?? manualSubmissionCategory;
  const submissionKey = input.submissionKey ?? manualSubmissionKey;

  const asset = input.createOnly
    ? await prisma.knowledgeAsset.create({
        data: {
          sourceMaterialId: input.sourceMaterialId,
          submissionKey,
          category,
          title: input.title,
          content: input.content,
          sourceType: input.sourceType,
          fileName: input.fileName ?? null,
          mimeType: input.mimeType ?? null,
          format: "text",
        },
      })
    : await prisma.knowledgeAsset.upsert({
        where: {
          sourceMaterialId_submissionKey: {
            sourceMaterialId: input.sourceMaterialId,
            submissionKey,
          },
        } as never,
        update: {
          title: input.title,
          content: input.content,
          sourceType: input.sourceType,
          fileName: input.fileName ?? null,
          mimeType: input.mimeType ?? null,
          format: "text",
          category,
        },
        create: {
          sourceMaterialId: input.sourceMaterialId,
          submissionKey,
          category,
          title: input.title,
          content: input.content,
          sourceType: input.sourceType,
          fileName: input.fileName ?? null,
          mimeType: input.mimeType ?? null,
          format: "text",
        },
      });

  await replaceAssetChunks(asset.id, input.content);
  return asset;
}

export async function syncGeneratedDocumentKnowledgeAsset(input: {
  generatedDocumentId: string;
  sourceMaterialId: string;
  title: string;
  content: string;
  format: string;
  sourceType: string;
}) {
  const asset = await prisma.knowledgeAsset.upsert({
    where: { generatedDocumentId: input.generatedDocumentId },
    update: {
      title: input.title,
      content: input.content,
      sourceType: input.sourceType,
      format: input.format,
      category: "generated_document",
      submissionKey: null,
    },
    create: {
      generatedDocumentId: input.generatedDocumentId,
      sourceMaterialId: input.sourceMaterialId,
      submissionKey: null,
      category: "generated_document",
      title: input.title,
      content: input.content,
      sourceType: input.sourceType,
      format: input.format,
    },
  });

  await replaceAssetChunks(asset.id, input.content);
  return asset;
}

export async function retrieveKnowledgeMatches(input: {
  sourceMaterialId: string;
  query: string;
  limit?: number;
}) {
  const assets = await prisma.knowledgeAsset.findMany({
    where: { sourceMaterialId: input.sourceMaterialId },
    include: { chunks: { orderBy: { ordinal: "asc" } } },
    orderBy: [{ category: "asc" }, { updatedAt: "desc" }],
  });

  const ranked = assets
    .flatMap((asset) =>
      asset.chunks.map((chunk) => {
        const keywords = resolveChunkKeywords(chunk.keywords, chunk.text);
        return {
          assetId: asset.id,
          assetTitle: asset.title,
          category: asset.category as KnowledgeAssetCategory,
          sourceType: asset.sourceType,
          ordinal: chunk.ordinal,
          text: chunk.text,
          keywords,
          score: scoreText(input.query, chunk.text, keywords),
        } satisfies RetrievedKnowledgeMatch;
      }),
    )
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score || left.ordinal - right.ordinal)
    .slice(0, input.limit ?? 6);

  if (ranked.length) return ranked;

  return assets
    .flatMap((asset) =>
      asset.chunks.slice(0, 2).map((chunk) => ({
        assetId: asset.id,
        assetTitle: asset.title,
        category: asset.category as KnowledgeAssetCategory,
        sourceType: asset.sourceType,
        ordinal: chunk.ordinal,
        text: chunk.text,
        keywords: resolveChunkKeywords(chunk.keywords, chunk.text),
        score: 0,
      })),
    )
    .slice(0, input.limit ?? 6);
}

export async function listKnowledgeAssetsByMaterial(sourceMaterialId: string): Promise<KnowledgeAssetDTO[]> {
  const assets = await prisma.knowledgeAsset.findMany({
    where: { sourceMaterialId },
    include: { chunks: { orderBy: { ordinal: "asc" } } },
    orderBy: [{ category: "asc" }, { updatedAt: "desc" }],
  });

  return assets.map((asset) => ({
    id: asset.id,
    sourceMaterialId: asset.sourceMaterialId,
    generatedDocumentId: asset.generatedDocumentId,
    category: asset.category as KnowledgeAssetCategory,
    title: asset.title,
    content: asset.content,
    sourceType: asset.sourceType,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    format: asset.format,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
    chunks: asset.chunks.map((chunk) => ({
      id: chunk.id,
      ordinal: chunk.ordinal,
      text: chunk.text,
      keywords: resolveChunkKeywords(chunk.keywords, chunk.text),
    })),
  }));
}
