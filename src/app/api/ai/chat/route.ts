import { NextResponse } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@/lib/ai/provider";
import { analysisToPayload } from "@/lib/analysis";
import { retrieveKnowledgeMatches } from "@/lib/knowledge-base";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  sourceMaterialId: z.string().min(1),
  question: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const { sourceMaterialId, question } = schema.parse(await request.json());
    const material = await prisma.sourceMaterial.findUnique({
      where: { id: sourceMaterialId },
      include: {
        analyses: { orderBy: { createdAt: "desc" }, take: 1 },
        documents: { orderBy: { updatedAt: "desc" } },
      },
    });
    if (!material) return NextResponse.json({ error: "Source material not found" }, { status: 404 });

    const retrievedContext = await retrieveKnowledgeMatches({
      sourceMaterialId,
      query: question,
    });

    await prisma.chatMessage.create({ data: { sourceMaterialId, role: "user", content: question } });
    const answer = await getAIProvider().chat({
      question,
      materialTitle: material.title,
      materialContent: material.content,
      analysis: material.analyses[0] ? analysisToPayload(material.analyses[0]) : undefined,
      documents: material.documents.map((document) => ({
        title: document.title,
        type: document.type,
        content: document.content,
      })),
      retrievedContext: retrievedContext.map((match) => ({
        ordinal: match.ordinal,
        text: `[${match.category}] ${match.assetTitle}\n${match.text}`,
        keywords: match.keywords,
        score: match.score,
      })),
    });
    const message = await prisma.chatMessage.create({
      data: { sourceMaterialId, role: "assistant", content: answer },
    });
    return NextResponse.json({ message, retrievedContext }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown chat error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
