import { describe, expect, it } from "vitest";
import { extractKeywords, parseKeywords, scoreChunk, splitIntoKnowledgeChunks } from "./rag";

describe("splitIntoKnowledgeChunks", () => {
  it("splits long materials into ordered chunks with keywords", () => {
    const chunks = splitIntoKnowledgeChunks(
      [
        "The warehouse team needs barcode scanning for inbound receiving and shelf moves.",
        "Customer service also needs order exception notes, proof-of-delivery lookup, and delay alerts.",
        "Training should cover scanner onboarding, exception triage, and dispatch coordination.",
      ].join("\n\n"),
      { chunkSize: 110, overlap: 16 },
    );

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]?.ordinal).toBe(0);
    expect(chunks[1]?.ordinal).toBe(1);
    expect(chunks[0]?.keywords.length).toBeGreaterThan(0);
  });
});

describe("extractKeywords and scoreChunk", () => {
  it("prioritizes relevant operational terms", () => {
    const keywords = extractKeywords("barcode scanning barcode receiving delay alerts dispatch alerts");
    expect(keywords).toContain("barcode");
    expect(keywords).toContain("alerts");

    const relevantScore = scoreChunk("How should barcode alerts work?", {
      text: "Barcode scanning should trigger alerts when an exception happens.",
      keywords,
    });
    const irrelevantScore = scoreChunk("How should barcode alerts work?", {
      text: "Finance approvals and annual budgeting details.",
      keywords: ["finance", "budgeting"],
    });

    expect(relevantScore).toBeGreaterThan(irrelevantScore);
  });

  it("prefers phrase-level Chinese keywords over single characters", () => {
    const keywords = extractKeywords("用户需要一套完善的零售全链路系统，覆盖采购、仓储、销售和会员管理。");
    expect(keywords).toContain("零售全链路系统");
    expect(keywords).not.toContain("的");
    expect(keywords).not.toContain("户");
  });
});

describe("parseKeywords", () => {
  it("parses persisted keyword payloads safely", () => {
    expect(parseKeywords(JSON.stringify(["barcode", "alert"]))).toEqual(["barcode", "alert"]);
    expect(parseKeywords("not-json")).toEqual([]);
  });
});
