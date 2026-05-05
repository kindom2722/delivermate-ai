import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const dbPath = join(process.cwd(), "prisma", "dev.db");
mkdirSync(dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

db.exec(`
DROP TABLE IF EXISTS "ChatMessage";
DROP TABLE IF EXISTS "KnowledgeChunk";
DROP TABLE IF EXISTS "KnowledgeAsset";
DROP TABLE IF EXISTS "GeneratedDocument";
DROP TABLE IF EXISTS "AnalysisResult";
DROP TABLE IF EXISTS "UATItem";
DROP TABLE IF EXISTS "TestCase";
DROP TABLE IF EXISTS "Requirement";
DROP TABLE IF EXISTS "SourceNote";
DROP TABLE IF EXISTS "Project";
DROP TABLE IF EXISTS "SourceMaterial";

CREATE TABLE IF NOT EXISTS "SourceMaterial" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'meeting',
  "content" TEXT NOT NULL,
  "fileName" TEXT,
  "mimeType" TEXT,
  "source" TEXT NOT NULL DEFAULT 'manual',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "AnalysisResult" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sourceMaterialId" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "background" TEXT NOT NULL DEFAULT '',
  "goals" TEXT NOT NULL DEFAULT '[]',
  "painPoints" TEXT NOT NULL DEFAULT '[]',
  "roles" TEXT NOT NULL DEFAULT '[]',
  "processNotes" TEXT NOT NULL DEFAULT '[]',
  "requirementCandidates" TEXT NOT NULL DEFAULT '[]',
  "functionCandidates" TEXT NOT NULL DEFAULT '[]',
  "risks" TEXT NOT NULL DEFAULT '[]',
  "openQuestions" TEXT NOT NULL DEFAULT '[]',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalysisResult_sourceMaterialId_fkey" FOREIGN KEY ("sourceMaterialId") REFERENCES "SourceMaterial" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "GeneratedDocument" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sourceMaterialId" TEXT NOT NULL,
  "analysisResultId" TEXT,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "format" TEXT NOT NULL DEFAULT 'markdown',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "GeneratedDocument_sourceMaterialId_fkey" FOREIGN KEY ("sourceMaterialId") REFERENCES "SourceMaterial" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "GeneratedDocument_analysisResultId_fkey" FOREIGN KEY ("analysisResultId") REFERENCES "AnalysisResult" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "KnowledgeAsset" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sourceMaterialId" TEXT NOT NULL,
  "generatedDocumentId" TEXT,
  "submissionKey" TEXT,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "fileName" TEXT,
  "mimeType" TEXT,
  "format" TEXT NOT NULL DEFAULT 'text',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "KnowledgeAsset_sourceMaterialId_fkey" FOREIGN KEY ("sourceMaterialId") REFERENCES "SourceMaterial" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "KnowledgeAsset_generatedDocumentId_fkey" FOREIGN KEY ("generatedDocumentId") REFERENCES "GeneratedDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "KnowledgeAsset_generatedDocumentId_key" ON "KnowledgeAsset"("generatedDocumentId");
CREATE UNIQUE INDEX IF NOT EXISTS "KnowledgeAsset_sourceMaterialId_submissionKey_key" ON "KnowledgeAsset"("sourceMaterialId", "submissionKey");
CREATE INDEX IF NOT EXISTS "KnowledgeAsset_sourceMaterialId_category_updatedAt_idx" ON "KnowledgeAsset"("sourceMaterialId", "category", "updatedAt");
CREATE INDEX IF NOT EXISTS "KnowledgeAsset_sourceMaterialId_updatedAt_idx" ON "KnowledgeAsset"("sourceMaterialId", "updatedAt");

CREATE TABLE IF NOT EXISTS "ChatMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sourceMaterialId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatMessage_sourceMaterialId_fkey" FOREIGN KEY ("sourceMaterialId") REFERENCES "SourceMaterial" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "KnowledgeChunk" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "knowledgeAssetId" TEXT NOT NULL,
  "ordinal" INTEGER NOT NULL,
  "text" TEXT NOT NULL,
  "keywords" TEXT NOT NULL DEFAULT '[]',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KnowledgeChunk_knowledgeAssetId_fkey" FOREIGN KEY ("knowledgeAssetId") REFERENCES "KnowledgeAsset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "KnowledgeChunk_knowledgeAssetId_ordinal_idx" ON "KnowledgeChunk"("knowledgeAssetId", "ordinal");
`);

db.close();
console.log(`SQLite database initialized at ${dbPath}`);
