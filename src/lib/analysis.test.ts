import { describe, expect, it } from "vitest";
import { analysisToPayload, payloadToAnalysisData } from "./analysis";
import { exportDocumentFilename } from "./markdown";

describe("analysis payload conversion", () => {
  it("round-trips structured analysis fields", () => {
    const data = payloadToAnalysisData({
      summary: "摘要",
      background: "业务背景",
      goals: ["统一需求口径"],
      painPoints: ["资料分散"],
      roles: ["交付顾问"],
      processNotes: ["整理原始材料"],
      requirementCandidates: [
        {
          title: "生成需求文档",
          description: "系统应将原始材料整理为结构化需求文档。",
          priority: "high",
          acceptanceCriteria: ["文档包含范围、目标与验收标准。"],
          openQuestions: ["客户是否有固定模板？"],
        },
      ],
      functionCandidates: [
        {
          name: "AI 分析",
          description: "提取结构化需求。",
          priority: "high",
          inputs: ["原始材料"],
          outputs: ["分析结果"],
          businessRules: ["资料不足时要明确标记缺口。"],
          openQuestions: [],
        },
      ],
      risks: ["资料不足会影响分析完整性。"],
      openQuestions: ["最终确认人是谁？"],
    });

    const payload = analysisToPayload({
      id: "a1",
      sourceMaterialId: "s1",
      createdAt: new Date(),
      ...data,
    });

    expect(payload.goals).toEqual(["统一需求口径"]);
    expect(payload.requirementCandidates[0]?.title).toBe("生成需求文档");
    expect(payload.functionCandidates[0]?.name).toBe("AI 分析");
  });
});

describe("exportDocumentFilename", () => {
  it("builds a markdown filename from document type and title", () => {
    expect(exportDocumentFilename({ type: "uat_table", title: "客户 UAT 表" })).toBe("uat_table-客户-uat-表.md");
  });
});
