import { NextResponse } from "next/server";
import { z } from "zod";
import { analysisToPayload } from "@/lib/analysis";
import { extractDocumentText } from "@/lib/document-extract";
import {
  createUploadSubmissionCategory,
  createUploadSubmissionKey,
  listKnowledgeAssetsByMaterial,
  syncSourceMaterialKnowledgeAsset,
} from "@/lib/knowledge-base";
import { appendLibraryContent, chooseLibraryFileName } from "@/lib/material-library";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  title: z.string().min(1),
  type: z.enum(["interview", "meeting", "business_context", "raw_requirements", "other"]).default("meeting"),
  content: z.string().min(10),
});
const uploadSchema = z.object({
  title: z.string().min(1),
  type: z.enum(["interview", "meeting", "business_context", "raw_requirements", "other"]).default("meeting"),
  sourceMaterialId: z.string().min(1).optional(),
});

export async function GET() {
  const materials = await prisma.sourceMaterial.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      analyses: { orderBy: { createdAt: "desc" }, take: 1 },
      documents: true,
      messages: true,
    },
  });
  const payload = await Promise.all(
    materials.map(async (material) => {
      const knowledgeAssets = await listKnowledgeAssetsByMaterial(material.id);
      return {
        ...material,
        analyses: material.analyses.map((analysis) => ({
          id: analysis.id,
          ...analysisToPayload(analysis),
        })),
        knowledgeAssets,
        chunks: knowledgeAssets.flatMap((asset) => asset.chunks),
      };
    }),
  );
  return NextResponse.json({ materials: payload });
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!(file instanceof File)) {
        return NextResponse.json({ error: "请先选择要上传的文件。" }, { status: 400 });
      }

      const payload = uploadSchema.parse({
        title: String(formData.get("title") ?? file.name.replace(/\.[^.]+$/, "")),
        type: String(formData.get("type") ?? "meeting"),
        sourceMaterialId:
          typeof formData.get("sourceMaterialId") === "string" ? String(formData.get("sourceMaterialId")) : undefined,
      });

      const content = await extractDocumentText(file);
      let material;

      if (payload.sourceMaterialId) {
        const existing = await prisma.sourceMaterial.findUnique({
          where: { id: payload.sourceMaterialId },
        });
        if (!existing) {
          return NextResponse.json({ error: "目标资料不存在。" }, { status: 404 });
        }

        const nextFileName = chooseLibraryFileName(existing.fileName, file.name);

        material = await prisma.sourceMaterial.update({
          where: { id: existing.id },
          data: {
            content: appendLibraryContent(existing.content, file.name, content),
            fileName: nextFileName,
            mimeType: nextFileName ? file.type || null : null,
            source: existing.source === "manual" ? "mixed" : existing.source,
          },
        });
      } else {
        material = await prisma.sourceMaterial.create({
          data: {
            title: payload.title,
            type: payload.type,
            content,
            fileName: file.name,
            mimeType: file.type || null,
            source: "upload",
          },
        });
      }

      const submissionKey = createUploadSubmissionKey();
      await syncSourceMaterialKnowledgeAsset({
        sourceMaterialId: material.id,
        title: file.name,
        content,
        sourceType: "upload",
        fileName: file.name,
        mimeType: file.type || null,
        submissionKey,
        category: createUploadSubmissionCategory(submissionKey),
        createOnly: true,
      });
      return NextResponse.json({ material }, { status: 201 });
    }

    const payload = schema.parse(await request.json());
    const material = await prisma.sourceMaterial.create({
      data: {
        ...payload,
        source: "manual",
      },
    });
    await syncSourceMaterialKnowledgeAsset({
      sourceMaterialId: material.id,
      title: material.title,
      content: material.content,
      sourceType: material.source,
      fileName: material.fileName,
      mimeType: material.mimeType,
    });
    return NextResponse.json({ material }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown source-material error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
