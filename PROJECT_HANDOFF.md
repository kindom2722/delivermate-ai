# DeliverMate Project Handoff

## Project Goal

DeliverMate is a Next.js + Prisma application for turning raw customer materials into delivery-ready artifacts.

Current product direction:

- Ingest customer materials from manual text input or uploaded documents.
- Analyze materials with a pluggable AI provider.
- Generate delivery documents such as requirements, feature lists, test cases, UAT tables, and training manuals.
- Support follow-up Q&A grounded in a local RAG-style knowledge base.
- Keep submitted source archives and generated documents as separate searchable knowledge assets.

## Key Decisions

### 1. RAG is local-first and SQLite-friendly

The current RAG implementation does not depend on an external vector database.

Reasons:

- The repo already uses SQLite + Prisma.
- A local retrieval MVP is faster to ship and easier to maintain.
- It keeps the architecture stable before introducing embeddings.

Current retrieval strategy:

- Split content into `KnowledgeChunk`s.
- Extract lightweight keywords locally.
- Score chunks by query/token overlap.
- Retrieve from both submitted source assets and generated document assets.

### 2. Knowledge assets are first-class records

RAG no longer treats only `SourceMaterial.content` as searchable text.

A dedicated `KnowledgeAsset` model represents:

- `submission:*`: manually entered or uploaded source archives
- `generated_document`: generated Markdown outputs

Important uniqueness rules:

- Generated document assets are uniquely identified by `generatedDocumentId`.
- Submission assets are uniquely identified by `(sourceMaterialId, submissionKey)`.
- This allows one material to keep multiple uploaded source assets and multiple generated document assets at the same time.

### 3. Keep AI provider selection configuration-driven

The provider boundary remains in `src/lib/ai`.

Current provider setup:

- `MockAIProvider` for stable local/dev behavior
- `DeepSeekProvider` for real model-backed analysis/chat

DeepSeek is only considered active when a usable `DEEPSEEK_API_KEY` is present. Otherwise the app falls back to mock behavior and labels itself accordingly.

### 4. Sync knowledge automatically at write boundaries

Knowledge assets/chunks are rebuilt automatically when:

- source material is created
- source material is updated
- uploaded files are appended to an existing material
- a generated document is created
- a generated document is edited

This avoids manual reindex steps.

## Current Architecture

### App Stack

- Framework: Next.js App Router
- Language: TypeScript
- Database: SQLite
- ORM: Prisma
- UI: React client components + Tailwind-based styling
- Testing: Vitest

### Main Data Flow

1. User submits text or uploads PDF/DOCX.
2. Backend creates or updates `SourceMaterial`.
3. Backend syncs one or more `KnowledgeAsset` records for submissions.
4. Backend chunks those assets into `KnowledgeChunk`s.
5. User triggers AI analysis.
6. Backend creates `AnalysisResult`.
7. User generates one or more delivery documents.
8. Backend creates `GeneratedDocument`.
9. Backend syncs a `KnowledgeAsset(category=generated_document)` per generated document.
10. Chat retrieves relevant chunks from both submission assets and generated document assets and sends them to the AI provider.

### Core Models

- `SourceMaterial`
- `AnalysisResult`
- `GeneratedDocument`
- `ChatMessage`
- `KnowledgeAsset`
- `KnowledgeChunk`

## Completed Work

### Material ingestion

- Manual material entry works.
- PDF/DOCX upload flow exists.
- Upload text extraction is implemented.
- Uploaded files can be appended to an existing material or saved as a new material.

### AI analysis

- Material analysis endpoint exists.
- Analysis results are persisted.
- Provider label is surfaced in UI.
- DeepSeek long-text handling includes summarization, shorter retries, and mock fallback.

### Document generation

- Delivery documents can be generated from analysis/material context.
- Generated documents can be previewed and edited.
- Export endpoint exists.
- Delete support exists for generated documents.

### Floating AI assistant

- Floating, draggable assistant UI exists.
- It follows the currently selected material.
- It supports quick questions and freeform chat.

### RAG / knowledge base

- Local chunking and keyword extraction exist.
- Retrieval no longer depends only on raw source text.
- Submitted archives and generated documents are both indexed as knowledge assets.
- Chat uses retrieved knowledge matches from knowledge assets.
- Knowledge sync is automatic on source/document writes.

### Quality checks

At the end of the latest work:

- `npm test`
- `npm run lint`
- `npm run build`

## Important Notes

### 1. `prisma generate` may still hit a Windows file-lock issue

Observed behavior:

- `npm run db:generate` can hit an `EPERM` rename error on `query_engine-windows.dll.node`.

Suggested fix if it blocks future work:

- Stop Node processes that may hold Prisma engine files.
- Re-run `npm run db:generate`.

### 2. Long-text DeepSeek analysis is stabilized, not perfect

The current fallback chain avoids 500-level failures, but it is still a best-effort strategy:

- summarize long input
- retry with shorter analysis sources
- fall back to mock analysis if DeepSeek cannot return valid JSON

### 3. Remaining product gaps are mostly polish and explainability

The biggest remaining gaps are:

- visible citations / source attribution in chat answers
- search / filters inside Knowledge Library
- richer traceability across requirements, functions, tests, and UAT

## Important Files

- [src/components/workspace-client.tsx](/D:/CodexProjects/git/DeliverMate/src/components/workspace-client.tsx)
  Main interactive UI.

- [src/lib/knowledge-base.ts](/D:/CodexProjects/git/DeliverMate/src/lib/knowledge-base.ts)
  Canonical knowledge asset sync and retrieval logic.

- [src/lib/ai/deepseek-provider.ts](/D:/CodexProjects/git/DeliverMate/src/lib/ai/deepseek-provider.ts)
  DeepSeek-backed analysis/chat path.

- [src/lib/ai/document-renderer.ts](/D:/CodexProjects/git/DeliverMate/src/lib/ai/document-renderer.ts)
  Local Markdown rendering from structured analysis output.

- [prisma/schema.prisma](/D:/CodexProjects/git/DeliverMate/prisma/schema.prisma)
  Prisma data model.

- [scripts/init-db.ts](/D:/CodexProjects/git/DeliverMate/scripts/init-db.ts)
  SQLite schema initialization script.

## Recommended Next Session Starting Points

If the next session is focused on RAG / knowledge base:

1. Start with [src/lib/knowledge-base.ts](/D:/CodexProjects/git/DeliverMate/src/lib/knowledge-base.ts)
2. Then inspect [src/app/api/ai/chat/route.ts](/D:/CodexProjects/git/DeliverMate/src/app/api/ai/chat/route.ts)
3. Then inspect [src/components/workspace-client.tsx](/D:/CodexProjects/git/DeliverMate/src/components/workspace-client.tsx)

If the next session is focused on schema / data:

1. Read [prisma/schema.prisma](/D:/CodexProjects/git/DeliverMate/prisma/schema.prisma)
2. Read [scripts/init-db.ts](/D:/CodexProjects/git/DeliverMate/scripts/init-db.ts)
3. Re-run `npm run db:migrate`
4. Re-run `npm run db:generate` after clearing Windows file locks if needed

If the next session is focused on polish:

1. Add source citations in chat responses
2. Add filters/search inside `Knowledge Library`
3. Improve asset previews and metadata
