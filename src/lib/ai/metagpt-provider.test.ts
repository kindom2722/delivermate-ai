import { afterEach, describe, expect, it, vi } from "vitest";
import type { AnalysisPayload } from "./types";

const ORIGINAL_ENV = { ...process.env };

const analysisPayload: AnalysisPayload = {
  summary: "summary",
  background: "background",
  goals: [],
  painPoints: [],
  roles: [],
  processNotes: [],
  requirementCandidates: [],
  functionCandidates: [],
  risks: [],
  openQuestions: [],
};

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
  vi.restoreAllMocks();
});

describe("MetaGPTBridgeProvider", () => {
  it("returns markdown from the bridge for document generation", async () => {
    process.env.DEEPSEEK_API_KEY = "secret";

    const bridge = await import("./metagpt-bridge");
    vi.spyOn(bridge, "runMetaGPTBridge").mockResolvedValue({
      ok: true,
      payload: "# 文档\n\nMetaGPT output",
    });

    const { MetaGPTBridgeProvider } = await import("./metagpt-provider");
    const provider = new MetaGPTBridgeProvider();

    const result = await provider.generateDocument({
      documentType: "requirements_doc",
      materialTitle: "资料",
      materialContent: "内容",
      analysis: analysisPayload,
    });

    expect(result).toContain("MetaGPT output");
  });

  it("falls back to deepseek provider when bridge fails and fallback is enabled", async () => {
    process.env.DEEPSEEK_API_KEY = "secret";
    process.env.METAGPT_ALLOW_DEEPSEEK_FALLBACK = "true";

    const bridge = await import("./metagpt-bridge");
    vi.spyOn(bridge, "runMetaGPTBridge").mockRejectedValue(new Error("bridge failed"));

    const deepSeek = await import("./deepseek-provider");
    vi.spyOn(deepSeek.DeepSeekProvider.prototype, "analyzeMaterial").mockResolvedValue(analysisPayload);

    const { MetaGPTBridgeProvider } = await import("./metagpt-provider");
    const provider = new MetaGPTBridgeProvider();

    const result = await provider.analyzeMaterial({
      title: "资料",
      type: "meeting",
      content: "内容",
    });

    expect(result.summary).toBe("summary");
  });
});
