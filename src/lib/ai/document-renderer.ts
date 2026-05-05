import type { AnalysisPayload, FunctionCandidate, GeneratedDocumentType, RequirementCandidate } from "./types";

function priorityLabel(priority: "high" | "medium" | "low") {
  return {
    high: "P1 / 高",
    medium: "P2 / 中",
    low: "P3 / 低",
  }[priority];
}

function clipText(value: string, length = 160) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "原始资料暂无足够内容。";
  return normalized.length > length ? `${normalized.slice(0, length)}...` : normalized;
}

function bulletList(items: string[], emptyText = "暂无") {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : `- ${emptyText}`;
}

function joinInline(items: string[], separator = "；", emptyText = "暂无") {
  return items.length ? items.join(separator) : emptyText;
}

function rangeStatement(analysis: AnalysisPayload) {
  const inScope = analysis.requirementCandidates.map((item) => item.title);
  const unresolved = analysis.openQuestions.length
    ? analysis.openQuestions.map((item) => `待明确后再确认是否纳入：${item}`)
    : ["原始资料中未明确的流程、角色权限和报表口径暂不承诺。"];

  return {
    inScope,
    unresolved,
  };
}

function requirementSection(item: RequirementCandidate, index: number) {
  const requirementId = `REQ-${String(index + 1).padStart(2, "0")}`;

  return [
    `### ${requirementId} ${item.title}`,
    "",
    `- 需求 ID：${requirementId}`,
    `- 关联角色：${item.role ?? "待确认"}`,
    `- 优先级：${priorityLabel(item.priority)}`,
    `- 需求说明：${item.description}`,
    `- 验收标准：`,
    ...item.acceptanceCriteria.map((criterion) => `  - ${criterion}`),
    `- 待确认点：${joinInline(item.openQuestions, "；", "无")}`,
  ].join("\n");
}

function functionRow(item: FunctionCandidate, index: number) {
  const functionId = `FUN-${String(index + 1).padStart(2, "0")}`;
  const userValue = item.role
    ? `支持${item.role}围绕“${item.name}”形成统一执行口径`
    : `支持业务与交付团队围绕“${item.name}”形成统一执行口径`;

  return `| ${functionId} | ${item.name} | ${userValue} | 基于原始资料触发 ${item.name} | ${joinInline(item.inputs, " / ")} | ${joinInline(item.outputs, " / ")} | ${joinInline(item.businessRules)} | ${joinInline(item.openQuestions, "；", "输出结果可直接用于后续评审")} | ${joinInline(item.openQuestions, "；", "无")} |`;
}

function buildRequirementsDocument(input: {
  materialTitle: string;
  materialContent: string;
  analysis: AnalysisPayload;
}) {
  const { materialTitle, materialContent, analysis } = input;
  const range = rangeStatement(analysis);
  const requirementRows = analysis.requirementCandidates.map(requirementSection).join("\n\n");

  return `# ${materialTitle} - 需求文档

## 文档定位

- 文档状态：草稿，可用于客户确认和内部评审
- 适用对象：${joinInline(analysis.roles, "、", "交付团队")}
- 来源资料：${materialTitle}
- 输出目标：把原始资料整理成有范围、有约束、有验收标准的交付规格
- 使用建议：本稿适合作为需求澄清会、方案评审会和 UAT 准备会的基础材料

## 背景与问题

### 原始资料摘录

> ${clipText(materialContent)}

### AI 摘要

${analysis.summary}

### 业务背景

${analysis.background}

## 范围说明

### 本次明确纳入范围

${bulletList(range.inScope, "待补充")}

### 当前暂不承诺范围

${bulletList(range.unresolved, "暂无")}

### 前置假设

- 当前输出以已提供资料为唯一事实基础，未出现在资料中的内容不默认承诺。
- 所有待确认项在客户澄清前均视为开放问题，不作为正式交付范围。

## 目标与角色

### 业务目标

${bulletList(analysis.goals, "待补充")}

### 关键角色

${bulletList(analysis.roles, "待补充")}

### 当前痛点

${bulletList(analysis.painPoints, "待补充")}

## 需求明细

${requirementRows || "暂无结构化需求，请先补充原始资料。"}

## 验收与完成定义

- 文档中的每条需求都能对应明确的业务问题或交付动作。
- 未确认信息不会被伪装成既定事实，而是进入待确认清单。
- 客户或业务负责人可以据此完成首轮范围确认。
- 后续测试用例、UAT 和培训材料必须以本稿为输入继续展开。
- 若存在审批人、输出格式或口径未定的情况，应在进入实施前完成补充确认。

## 风险与待确认事项

### 交付风险

${bulletList(analysis.risks, "暂无明显风险")}

### 待确认问题

${bulletList(analysis.openQuestions, "暂无")}

### 流程备注

${bulletList(analysis.processNotes, "暂无")}
`;
}

function buildFunctionList(input: { materialTitle: string; analysis: AnalysisPayload }) {
  const rows = input.analysis.functionCandidates.map(functionRow).join("\n");

  return `# ${input.materialTitle} - 功能清单

## 使用说明

- 本清单面向产品、交付、实施和客户确认场景。
- 每个功能条目都应回答“为什么做、何时触发、输入输出是什么、怎样算完成”。
- 未被原始资料明确支持的内容应进入待确认点，而不是直接承诺。
- 建议在客户确认前重点检查功能边界、输入依赖和验收信号三列。

## 功能列表

| 功能 ID | 功能名称 | 用户价值 | 触发条件 | 关键输入 | 系统输出 | 业务规则 | 验收信号 | 待确认点 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows || "| FUN-00 | 待补充 | 待补充 | 待补充 | 待补充 | 待补充 | 待补充 | 待补充 | 待补充 |"}
`;
}

function buildTestCases(input: { materialTitle: string; analysis: AnalysisPayload }) {
  const positiveRows = input.analysis.functionCandidates.map((item, index) => {
    const caseId = `TC-${String(index + 1).padStart(2, "0")}`;
    return `| ${caseId} | ${item.name} 正常流程 | ${item.name} | 用户提供完整资料并发起操作 | 1. 打开对应功能 2. 输入必填信息 3. 触发生成 | 系统返回结构清晰、可编辑的结果 | 正常流程 | ${priorityLabel(item.priority)} |`;
  });

  const negativeRows = input.analysis.functionCandidates.map((item, index) => {
    const caseId = `TC-${String(index + 101).padStart(3, "0")}`;
    return `| ${caseId} | ${item.name} 资料不足提示 | ${item.name} | 原始资料缺少关键背景或验收口径 | 1. 输入不完整资料 2. 触发 AI 处理 3. 查看结果 | 系统输出待确认问题，并提示资料缺口 | 异常流程 | ${priorityLabel(item.priority)} |`;
  });

  return `# ${input.materialTitle} - 测试用例

## 编写原则

- 测试用例应覆盖正常流程、异常流程、资料缺失和边界场景。
- 每条测试都应可执行，不能只写抽象口号。

## 用例清单

| 用例 ID | 用例标题 | 关联功能 | 前置条件 | 操作步骤 | 预期结果 | 测试类型 | 优先级 |
| --- | --- | --- | --- | --- | --- | --- | --- |
${[...positiveRows, ...negativeRows].join("\n")}
`;
}

function buildUatTable(input: { materialTitle: string; analysis: AnalysisPayload }) {
  const rows = input.analysis.requirementCandidates
    .map((item, index) => {
      const uatId = `UAT-${String(index + 1).padStart(2, "0")}`;
      return `| ${uatId} | ${item.title} | 客户验证 ${item.description} | 进入文档预览页并检查生成结果 | ${item.acceptanceCriteria[0] ?? "符合客户预期"} | 待指定 | 待开始 | ${joinInline(item.openQuestions, "；", "无")} |`;
    })
    .join("\n");

  return `# ${input.materialTitle} - UAT 表

## 说明

- UAT 项目应使用客户可理解的语言，而不是技术术语堆砌。
- 如果客户负责人尚未明确，需要在正式验收前补齐。

## UAT 清单

| UAT ID | 验收项目 | 业务场景 | 操作路径 | 验收标准 | 客户负责人 | 状态 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- |
${rows || "| UAT-00 | 待补充 | 待补充 | 待补充 | 待补充 | 待指定 | 待开始 | 待补充 |"}
`;
}

function buildTrainingManual(input: { materialTitle: string; analysis: AnalysisPayload }) {
  return `# ${input.materialTitle} - 培训手册

## 适用对象

${bulletList(input.analysis.roles, "终端用户")}

## 培训目标

${bulletList(input.analysis.goals, "帮助用户理解系统的关键流程")}

## 使用前准备

- 准备客户访谈、会议纪要或业务背景资料。
- 明确需要输出的文档类型和本轮交付范围。
- 对资料中不确定的内容先标记为待确认。

## 核心功能概览

${input.analysis.functionCandidates.map((item, index) => `${index + 1}. ${item.name}：${item.description}`).join("\n")}

## 推荐操作步骤

1. 录入或选择原始资料。
2. 运行 AI 分析，检查背景、目标、风险和待确认问题。
3. 选择目标文档类型并生成草稿。
4. 逐项修订需求、功能点和验收口径。
5. 导出 Markdown 用于客户确认或内部评审。

## 注意事项

${bulletList(input.analysis.risks, "如资料不足，优先补充而不是强行生成结论")}

## 常见问题

${bulletList(input.analysis.openQuestions, "暂无")}
`;
}

export function renderDocument(input: {
  documentType: GeneratedDocumentType;
  materialTitle: string;
  materialContent: string;
  analysis: AnalysisPayload;
}) {
  const generators: Record<GeneratedDocumentType, () => string> = {
    requirements_doc: () => buildRequirementsDocument(input),
    function_list: () => buildFunctionList(input),
    test_cases: () => buildTestCases(input),
    uat_table: () => buildUatTable(input),
    training_manual: () => buildTrainingManual(input),
  };

  return generators[input.documentType]();
}
