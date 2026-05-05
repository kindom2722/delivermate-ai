import { describe, expect, it } from "vitest";
import { MockAIProvider } from "./mock-provider";
import type { AnalysisPayload } from "./types";

const analysis: AnalysisPayload = {
  summary: "客户希望将分散的需求资料整理成可评审、可测试、可交付的标准文档。",
  background: "客户目前通过表格、聊天记录和会议纪要传递需求，信息分散且表达方式不统一。",
  goals: ["统一需求表达", "缩短文档整理时间", "提升客户确认效率"],
  painPoints: ["需求来源分散", "范围边界不清晰", "验收口径不统一"],
  roles: ["交付顾问", "客户业务负责人", "项目助理"],
  processNotes: ["收集资料", "AI 分析", "人工校对", "客户确认"],
  requirementCandidates: [
    {
      title: "统一生成客户确认版需求文档",
      description: "系统应根据原始资料生成可用于客户确认的需求文档草稿。",
      role: "交付顾问",
      priority: "high",
      acceptanceCriteria: ["文档包含业务背景、范围、验收标准和待确认问题。", "客户可在 10 分钟内完成首轮审阅。"],
      openQuestions: ["客户是否有固定文档模板？"],
    },
  ],
  functionCandidates: [
    {
      name: "文档生成",
      description: "根据资料和分析结果生成多种交付文档。",
      role: "项目助理",
      priority: "high",
      inputs: ["原始资料", "分析结果", "文档类型"],
      outputs: ["需求文档", "功能清单"],
      businessRules: ["不得虚构资料中不存在的业务事实。", "资料不足时必须输出待确认问题。"],
      openQuestions: ["是否需要导出 DOCX？"],
    },
  ],
  risks: ["资料缺少明确范围时可能生成过宽内容。"],
  openQuestions: ["本次交付是否包含培训手册？", "客户审批人是谁？"],
};

describe("MockAIProvider document generation", () => {
  const provider = new MockAIProvider();

  it("generates a requirements document with delivery-grade sections", async () => {
    const content = await provider.generateDocument({
      documentType: "requirements_doc",
      materialTitle: "客户需求纪要",
      materialContent: "原始资料正文",
      analysis,
    });

    expect(content).toContain("## 文档定位");
    expect(content).toContain("## 范围说明");
    expect(content).toContain("## 需求明细");
    expect(content).toContain("## 验收与完成定义");
    expect(content).toContain("## 风险与待确认事项");
    expect(content).toContain("需求 ID");
  });

  it("generates a feature list with decision-ready columns", async () => {
    const content = await provider.generateDocument({
      documentType: "function_list",
      materialTitle: "客户需求纪要",
      materialContent: "原始资料正文",
      analysis,
    });

    expect(content).toContain("| 功能 ID |");
    expect(content).toContain("用户价值");
    expect(content).toContain("触发条件");
    expect(content).toContain("验收信号");
    expect(content).toContain("待确认点");
  });
});
