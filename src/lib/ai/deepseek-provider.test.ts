import { describe, expect, it } from "vitest";
import { buildAnalysisSource, extractJsonObject, parseMarkdownAnalysis } from "./deepseek-provider";
import { renderDocument } from "./document-renderer";
import type { AnalysisPayload } from "./types";

const analysis: AnalysisPayload = {
  summary: "客户希望把分散的原始资料整理成可确认、可评审的交付文档。",
  background: "现有资料来自会议纪要和聊天记录，表达方式不统一。",
  goals: ["统一需求表述"],
  painPoints: ["资料分散"],
  roles: ["交付顾问"],
  processNotes: ["收集资料", "生成文档"],
  requirementCandidates: [
    {
      title: "生成需求文档",
      description: "系统应生成结构化需求文档。",
      priority: "high",
      acceptanceCriteria: ["文档包含范围和验收标准。"],
      openQuestions: ["客户是否已有模板？"],
    },
  ],
  functionCandidates: [
    {
      name: "AI 分析",
      description: "提取结构化需求。",
      priority: "high",
      inputs: ["原始资料"],
      outputs: ["分析结果"],
      businessRules: ["不得虚构事实。"],
      openQuestions: [],
    },
  ],
  risks: ["资料不足时需要补充。"],
  openQuestions: ["客户确认人是谁？"],
};

describe("extractJsonObject", () => {
  it("extracts json from fenced markdown", () => {
    const input = '```json\n{"summary":"ok"}\n```';
    expect(extractJsonObject(input)).toBe('{"summary":"ok"}');
  });

  it("extracts the first balanced json object from plain text", () => {
    const input = 'answer: {"summary":"ok","goals":["a}b"]} trailing note';
    expect(extractJsonObject(input)).toBe('{"summary":"ok","goals":["a}b"]}');
  });
});

describe("buildAnalysisSource", () => {
  it("keeps short content unchanged", () => {
    expect(buildAnalysisSource("short text", 20)).toBe("short text");
  });

  it("compacts long content while keeping head and tail context", () => {
    const input = `${"A".repeat(5000)}${"B".repeat(5000)}`;
    const output = buildAnalysisSource(input, 2000);

    expect(output.length).toBeGreaterThan(1000);
    expect(output).toContain("中间内容已省略");
    expect(output.startsWith("AAAA")).toBe(true);
    expect(output.trim().endsWith("BBBB")).toBe(true);
  });
});

describe("parseMarkdownAnalysis", () => {
  it("parses structured markdown into an analysis payload", () => {
    const markdown = `
## 分析摘要
需要把会议纪要整理成可交付文档。

## 业务背景
客户当前主要依赖手工整理资料。

## 业务目标
- 统一需求口径
- 缩短整理时间

## 关键角色
- 交付顾问
- 客户负责人

## 当前痛点
- 资料分散

## 流程备注
- 先录入资料
- 再生成文档

## 候选需求
### 需求 1：生成需求文档
- 描述：系统应输出结构化需求文档。
- 角色：交付顾问
- 优先级：high
- 验收标准：
  - 文档包含范围
  - 文档包含验收标准
- 待确认：
  - 客户模板是否固定

## 候选功能
### 功能 1：AI 分析
- 描述：提取需求和风险。
- 角色：交付顾问
- 优先级：medium
- 输入：
  - 原始资料
- 输出：
  - 分析结果
- 业务规则：
  - 不得虚构事实
- 待确认：
  - 是否保留历史版本

## 风险
- 原始资料不足

## 待确认问题
- 客户确认人是谁
`;

    const payload = parseMarkdownAnalysis(markdown);

    expect(payload.summary).toContain("可交付文档");
    expect(payload.background).toContain("手工整理");
    expect(payload.goals).toEqual(["统一需求口径", "缩短整理时间"]);
    expect(payload.requirementCandidates[0]?.title).toBe("生成需求文档");
    expect(payload.requirementCandidates[0]?.acceptanceCriteria).toEqual(["文档包含范围", "文档包含验收标准"]);
    expect(payload.functionCandidates[0]?.name).toBe("AI 分析");
    expect(payload.functionCandidates[0]?.priority).toBe("medium");
  });
});

describe("renderDocument", () => {
  it("renders requirements docs from structured analysis payload", () => {
    const content = renderDocument({
      documentType: "requirements_doc",
      materialTitle: "客户纪要",
      materialContent: "原始资料",
      analysis,
    });

    expect(content).toContain("## 文档定位");
    expect(content).toContain("REQ-01");
    expect(content).toContain("## 验收与完成定义");
  });
});
