import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("knowledge model constraints", () => {
  it("does not enforce one generated document asset per material category", () => {
    const schema = readFileSync(join(root, "prisma", "schema.prisma"), "utf8");

    expect(schema).not.toContain("@@unique([sourceMaterialId, category])");
  });

  it("keeps init-db aligned with the prisma uniqueness strategy", () => {
    const initDb = readFileSync(join(root, "scripts", "init-db.ts"), "utf8");

    expect(initDb).not.toContain(`"KnowledgeAsset_sourceMaterialId_category_key" ON "KnowledgeAsset"("sourceMaterialId", "category")`);
    expect(initDb).toContain(`"KnowledgeAsset_generatedDocumentId_key" ON "KnowledgeAsset"("generatedDocumentId")`);
  });
});
