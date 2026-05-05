import { renderDocument } from "./document-renderer";
import type { AIProvider, AnalysisPayload, GeneratedDocumentType, SourceMaterialType } from "./types";

const mockAnalysisPayload: AnalysisPayload = {
  summary:
    "已基于当前资料整理出一版可继续交付的结构化分析，重点覆盖业务目标、关键角色、候选需求与待确认事项。",
  background:
    "客户目前通过表格、聊天记录和会议纪要传递需求，信息分散且表达方式不统一。",
  goals: ["统一需求口径", "减少交付顾问手工整理时间", "支撑后续测试、UAT 与培训交付"],
  painPoints: ["原始信息分散", "业务边界不清晰", "验收标准容易遗漏"],
  roles: ["交付顾问", "客户业务负责人", "项目助理", "最终用户"],
  processNotes: ["收集原始资料", "AI 结构化分析", "人工校对", "客户确认", "交付输出"],
  requirementCandidates: [
    {
      title: "整理原始材料为可确认需求文档",
      description: "系统应将访谈纪要、会议记录和零散要求整理为结构化需求草稿。",
      role: "交付顾问",
      priority: "high",
      acceptanceCriteria: ["文档包含背景、范围、关键需求、验收要点和待确认问题。"],
      openQuestions: ["客户是否已有固定模板或审批格式？"],
    },
    {
      title: "生成多类交付文档草稿",
      description:
        "系统应基于同一份分析结果生成需求文档、功能清单、测试用例、UAT 表和培训手册。",
      role: "项目助理",
      priority: "high",
      acceptanceCriteria: ["输出内容可预览、可编辑并导出 Markdown。", "不同文档之间的口径保持一致。"],
      openQuestions: ["后续是否需要 DOCX 或 PDF 导出？"],
    },
  ],
  functionCandidates: [
    {
      name: "AI 需求分析",
      description: "从原始材料中提取目标、痛点、角色、需求候选和风险。",
      role: "交付顾问",
      priority: "high",
      inputs: ["原始材料文本"],
      outputs: ["结构化分析结果"],
      businessRules: ["资料不足时必须显式指出缺口，不能虚构事实。"],
      openQuestions: ["是否需要保留多次分析版本？"],
    },
    {
      name: "文档生成与导出",
      description: "基于结构化分析结果生成交付文档，并支持人工修订后导出。",
      role: "项目助理",
      priority: "high",
      inputs: ["分析结果", "文档类型"],
      outputs: ["Markdown 交付文档"],
      businessRules: ["文档草稿必须标出未确认信息。", "导出前允许人工编辑。"],
      openQuestions: ["是否需要版本号和审批状态？"],
    },
  ],
  risks: ["当原始资料缺少边界和验收标准时，生成内容仍需要人工补齐。"],
  openQuestions: ["客户确认人是谁？", "是否已有标准模板？", "哪些内容不在本次交付范围内？"],
};

export class MockAIProvider implements AIProvider {
  async analyzeMaterial(input: {
    title: string;
    type: SourceMaterialType;
    content: string;
  }): Promise<AnalysisPayload> {
    const preview = input.content.replace(/\s+/g, " ").slice(0, 140);

    void input.type;

    return {
      ...mockAnalysisPayload,
      summary: `已基于《${input.title}》整理出一版可继续交付的结构化分析，重点覆盖业务目标、关键角色、候选需求与待确认事项。`,
      background: preview || "当前资料较短，建议补充更完整的业务背景和流程描述。",
    };
  }

  async generateDocument(input: {
    documentType: GeneratedDocumentType;
    materialTitle: string;
    materialContent: string;
    analysis: AnalysisPayload;
  }): Promise<string> {
    return renderDocument(input);
  }

  async chat(input: {
    question: string;
    materialTitle: string;
    materialContent: string;
    analysis?: AnalysisPayload;
    documents: Array<{ title: string; type: string; content: string }>;
    retrievedContext: Array<{ ordinal: number; text: string; keywords: string[]; score: number }>;
  }): Promise<string> {
    const leadChunk = input.retrievedContext[0];
    const evidence = leadChunk
      ? `\n\n参考片段 #${leadChunk.ordinal + 1}：${leadChunk.text.slice(0, 160)}${leadChunk.text.length > 160 ? "..." : ""}`
      : "";
    const summary = input.analysis?.summary ?? `当前已基于《${input.materialTitle}》保存资料并可继续追问。`;
    const gaps =
      input.analysis?.openQuestions.length && input.analysis.openQuestions.length > 0
        ? input.analysis.openQuestions.join("；")
        : "建议补充客户确认人、交付边界和验收标准。";
    const docHint = input.documents[0]?.title ? `已生成文档：${input.documents[0].title}。` : "";

    void input.materialContent;

    if (/总结|摘要|核心/.test(input.question)) {
      return `${summary}${docHint ? ` ${docHint}` : ""}${evidence}`;
    }

    if (/补充|待确认|不清楚|缺少/.test(input.question)) {
      return `基于当前资料，优先建议补充：${gaps}${evidence}`;
    }

    return `我会围绕《${input.materialTitle}》回答“${input.question}”。目前可确认的信息是：${summary} ${docHint}如需更稳妥推进，建议把回答与待确认项一起回收给客户。${evidence}`;
  }
}
