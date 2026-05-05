# DeliverMate AI PRD v2

## 1. 产品概述

### 1.1 产品名称

DeliverMate AI

### 1.2 产品定位

DeliverMate AI 是一个面向项目交付、IT 咨询、软件实施、产品运营和项目助理的通用 AI 交付文档生成平台。

用户将客户访谈、会议纪要、业务背景、零散需求、调研记录等文字资料输入系统后，系统通过 AI 自动分析内容，并生成结构化交付材料，包括需求文档、功能清单、测试用例、UAT 表、培训手册和待确认问题清单。

产品重点不是针对某个垂直行业，也不是复杂项目管理系统，而是帮助用户把非结构化客户资料快速整理成可沟通、可评审、可测试、可交付的标准化文档资产。

### 1.3 产品目标

- 将零散文字资料自动转换为结构化交付文档。
- 降低项目助理、交付顾问、实施顾问整理需求和文档的时间成本。
- 帮助用户从客户资料中识别需求、功能点、测试场景、UAT 验收点和培训内容。
- 支持用户围绕已输入资料进行 AI 提问，快速追问不清楚的需求、风险和文档内容。
- 作为作品集项目，展示 AI 文档生成、结构化信息抽取、前后端开发和 LLM 工作流设计能力。

### 1.4 目标用户

- 项目助理
- FDE / 交付顾问
- 软件实施顾问
- IT 咨询顾问
- 产品经理 / 产品运营
- 需要整理客户需求和交付材料的业务人员

### 1.5 核心使用场景

用户拿到一段客户访谈、会议纪要或业务背景描述后，将文本粘贴到 DeliverMate AI。系统自动识别客户背景、业务目标、痛点、需求、功能点、流程、角色、风险和待确认问题，并一键生成多种交付文档。

用户还可以针对当前资料向 AI 提问，例如：

- “这段访谈里有哪些核心需求？”
- “哪些需求还不够清楚？”
- “帮我生成一份 UAT 验收表。”
- “这个客户的培训手册应该包含哪些内容？”
- “请把功能清单改成更适合客户确认的表达。”

## 2. MVP 范围

### 2.1 MVP 必做功能

1. 文本资料录入
2. AI 内容分析
3. AI 生成需求文档
4. AI 生成功能清单
5. AI 生成测试用例
6. AI 生成 UAT 表
7. AI 生成培训手册
8. 文档预览与编辑
9. Markdown 导出
10. 基于当前资料的 AI 问答

### 2.2 MVP 不做功能

- 不做登录系统
- 不做复杂权限体系
- 不做行业专属模板
- 不做项目阶段看板
- 不做复杂任务管理
- 不做多人协作
- 不做 PDF / Word 文件上传解析
- 不做 RAG 知识库
- 不做客户确认链接
- 不做多租户和计费系统

### 2.3 后续可扩展功能

- 文件上传：PDF、Word、TXT、Markdown
- 多资料汇总分析
- 行业模板
- 文档版本历史
- 文档对比
- Mermaid 流程图生成
- 多模型切换
- RAG 知识库问答
- DOCX / PDF 导出

## 3. 信息架构

MVP 建议采用简洁的工作台结构：

1. 首页 / 工作台
2. 资料输入
3. AI 分析结果
4. 文档生成
5. AI 问答
6. 文档中心

不需要复杂的项目导航和交付看板。第一屏应该直接服务核心工作流：

```text
输入资料 -> AI 分析 -> 生成文档 -> 编辑预览 -> 导出 / 提问
```

## 4. 功能需求

### 4.1 文本资料录入

#### 功能说明

用户可以粘贴客户访谈、会议纪要、业务背景、调研记录或零散需求文本。

#### 输入字段

- 资料标题
- 资料类型
- 原始文本内容

#### 资料类型

- 客户访谈
- 会议纪要
- 业务背景
- 零散需求
- 其他

#### 验收标准

- 用户可以创建一条文本资料。
- 用户可以查看已保存资料。
- 用户可以选择一条资料作为 AI 分析输入。
- 文本内容不应绑定某个行业模板。

### 4.2 AI 内容分析

#### 功能说明

系统读取用户输入的原始文本，自动提取结构化信息。

#### 输出内容

- 内容摘要
- 客户背景
- 业务目标
- 当前痛点
- 涉及角色
- 业务流程
- 需求候选
- 功能点候选
- 风险点
- 待确认问题

#### 验收标准

- AI 输出必须结构化展示。
- AI 不应编造原文没有的信息。
- 不确定内容必须进入“待确认问题”。
- 输出内容必须保持通用，不偏向特定行业。

### 4.3 AI 生成需求文档

#### 功能说明

系统根据原始资料和 AI 分析结果生成一份需求文档。

#### 文档结构

- 背景说明
- 业务目标
- 用户角色
- 业务痛点
- 需求范围
- 详细需求
- 验收标准
- 风险与假设
- 待确认问题

#### 验收标准

- 用户可以一键生成需求文档。
- 文档可以预览和编辑。
- 文档可以保存到文档中心。
- 文档可以导出 Markdown。

### 4.4 AI 生成功能清单

#### 功能说明

系统将资料中的需求拆解成清晰的功能清单。

#### 功能清单字段

- 功能名称
- 功能说明
- 对应用户角色
- 优先级
- 输入信息
- 输出结果
- 业务规则
- 待确认点

#### 验收标准

- 功能清单以表格形式展示。
- 用户可以编辑功能项。
- 功能项必须来自原始资料或合理归纳，不能凭空扩展。

### 4.5 AI 生成测试用例

#### 功能说明

系统根据需求文档或功能清单生成测试用例。

#### 测试用例字段

- 用例标题
- 关联功能
- 测试场景
- 前置条件
- 操作步骤
- 预期结果
- 测试类型
- 优先级

#### 测试类型

- 正常流程
- 异常流程
- 数据校验
- 权限/角色
- 边界条件

#### 验收标准

- 每个主要功能至少生成一条测试用例。
- 测试步骤和预期结果必须清晰可执行。
- 用户可以编辑测试用例。

### 4.6 AI 生成 UAT 表

#### 功能说明

系统将需求和功能清单转换为面向客户确认的 UAT 验收表。

#### UAT 表字段

- UAT 项目
- 业务场景
- 操作路径
- 验收标准
- 客户确认人
- 验收状态
- 备注

#### 验收状态

- 未开始
- 进行中
- 已通过
- 未通过
- 待确认

#### 验收标准

- UAT 表以客户可读的语言表达。
- UAT 项应对应需求或功能点。
- 用户可以编辑验收状态和备注。

### 4.7 AI 生成培训手册

#### 功能说明

系统根据需求和功能清单生成面向最终用户或客户团队的培训手册。

#### 手册结构

- 适用对象
- 功能概览
- 使用前准备
- 操作步骤
- 常见问题
- 注意事项
- 联系或反馈方式

#### 验收标准

- 培训手册语言应偏向用户指导，而不是技术说明。
- 操作步骤应清晰分段。
- 用户可以编辑和导出培训手册。

### 4.8 文档中心

#### 功能说明

系统集中管理 AI 生成的所有文档。

#### 文档类型

- 需求文档
- 功能清单
- 测试用例
- UAT 表
- 培训手册

#### 验收标准

- 用户可以查看所有生成文档。
- 用户可以预览文档内容。
- 用户可以编辑文档。
- 用户可以导出 Markdown。

### 4.9 AI 问答

#### 功能说明

用户可以基于当前资料和已生成文档向 AI 提问。

#### 示例问题

- “请总结这份会议纪要的核心需求。”
- “哪些信息还需要客户补充？”
- “请把需求整理成客户容易理解的版本。”
- “这份 UAT 表是否覆盖了主要功能？”
- “请生成一段适合写进项目汇报的摘要。”

#### 回答依据

AI 回答应基于：

- 当前选中的原始资料
- AI 分析结果
- 已生成文档

#### 验收标准

- 用户可以输入问题并获得回答。
- 回答应尽量引用当前资料内容。
- 如果资料不足，AI 应明确说明缺少哪些信息。
- AI 不应假装知道资料中没有的信息。

## 5. 数据模型

### 5.1 SourceMaterial

```ts
type SourceMaterial = {
  id: string;
  title: string;
  type: "interview" | "meeting" | "business_context" | "raw_requirements" | "other";
  content: string;
  createdAt: string;
  updatedAt: string;
};
```

### 5.2 AnalysisResult

```ts
type AnalysisResult = {
  id: string;
  sourceMaterialId: string;
  summary: string;
  background: string;
  goals: string[];
  painPoints: string[];
  roles: string[];
  processNotes: string[];
  requirementCandidates: RequirementCandidate[];
  functionCandidates: FunctionCandidate[];
  risks: string[];
  openQuestions: string[];
  createdAt: string;
};
```

### 5.3 RequirementCandidate

```ts
type RequirementCandidate = {
  title: string;
  description: string;
  role?: string;
  priority: "high" | "medium" | "low";
  acceptanceCriteria: string[];
  openQuestions: string[];
};
```

### 5.4 FunctionCandidate

```ts
type FunctionCandidate = {
  name: string;
  description: string;
  role?: string;
  priority: "high" | "medium" | "low";
  inputs: string[];
  outputs: string[];
  businessRules: string[];
  openQuestions: string[];
};
```

### 5.5 GeneratedDocument

```ts
type GeneratedDocument = {
  id: string;
  sourceMaterialId: string;
  analysisResultId?: string;
  type: "requirements_doc" | "function_list" | "test_cases" | "uat_table" | "training_manual";
  title: string;
  content: string;
  format: "markdown" | "json";
  createdAt: string;
  updatedAt: string;
};
```

### 5.6 ChatMessage

```ts
type ChatMessage = {
  id: string;
  sourceMaterialId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};
```

## 6. AI 能力设计

### 6.1 AI 功能列表

| 能力 | 输入 | 输出 |
| --- | --- | --- |
| 内容分析 | 原始文字资料 | 摘要、需求、功能点、风险、待确认问题 |
| 需求文档生成 | 原始资料 + 分析结果 | Markdown 需求文档 |
| 功能清单生成 | 原始资料 + 需求候选 | 表格化功能清单 |
| 测试用例生成 | 功能清单 / 需求文档 | 测试用例表 |
| UAT 表生成 | 功能清单 / 测试用例 | 客户验收表 |
| 培训手册生成 | 功能清单 / 需求文档 | 用户培训手册 |
| AI 问答 | 用户问题 + 当前上下文 | 基于资料的回答 |

### 6.2 Prompt 原则

- 输入必须包含资料标题、资料类型和原始内容。
- 输出必须结构化，便于页面展示和保存。
- 不得编造原始资料中不存在的业务事实。
- 不确定内容必须写入 `openQuestions`。
- 生成文档应保持通用，不使用固定行业术语。
- AI 输出是草稿，用户可以编辑。

### 6.3 Mock AI 要求

MVP 可以先使用 Mock AI，但 Mock 内容必须满足：

- 不绑定零售、餐饮、制造等具体行业。
- 示例应使用通用表达，例如“客户”“业务部门”“管理员”“最终用户”。
- 生成结果要体现真实结构，而不是硬编码行业故事。
- 后续可以通过统一 `AIProvider` 切换真实 LLM。

## 7. 页面设计

### 7.1 首页 / 工作台

首页直接展示核心操作：

- 选择或创建资料
- 粘贴原始文本
- 点击 AI 分析
- 快速生成文档
- 进入 AI 问答

不需要行业看板，不需要项目阶段列，不需要复杂指标。

### 7.2 资料输入页

- 左侧：资料列表
- 中间：文本编辑区
- 右侧：AI 分析入口和最近生成文档

### 7.3 AI 分析页

- 内容摘要
- 需求候选
- 功能点候选
- 风险点
- 待确认问题
- 一键生成文档按钮

### 7.4 文档生成页

用户选择要生成的文档类型：

- 需求文档
- 功能清单
- 测试用例
- UAT 表
- 培训手册

页面展示生成结果，并允许编辑、保存、导出。

### 7.5 AI 问答页

- 左侧：当前资料和文档上下文
- 中间：问答对话
- 底部：问题输入框
- 右侧：推荐问题

### 7.6 文档中心页

- 文档类型筛选
- 文档列表
- 文档预览
- 编辑
- Markdown 导出

## 8. API 设计

### 8.1 资料 API

```text
GET    /api/source-materials
POST   /api/source-materials
GET    /api/source-materials/:id
PATCH  /api/source-materials/:id
DELETE /api/source-materials/:id
```

### 8.2 AI API

```text
POST /api/ai/analyze-material
POST /api/ai/generate-requirements-doc
POST /api/ai/generate-function-list
POST /api/ai/generate-test-cases
POST /api/ai/generate-uat-table
POST /api/ai/generate-training-manual
POST /api/ai/chat
```

### 8.3 文档 API

```text
GET    /api/documents
POST   /api/documents
GET    /api/documents/:id
PATCH  /api/documents/:id
DELETE /api/documents/:id
GET    /api/documents/:id/export
```

## 9. MVP 用户流程

### 9.1 最小闭环

```text
粘贴资料
-> 点击 AI 分析
-> 查看需求/功能点/风险/待确认问题
-> 生成需求文档
-> 生成功能清单
-> 生成测试用例
-> 生成 UAT 表
-> 生成培训手册
-> 编辑文档
-> 导出 Markdown
```

### 9.2 AI 问答流程

```text
选择资料
-> 输入问题
-> AI 基于当前资料和文档回答
-> 用户继续追问或将回答复制进文档
```

## 10. 验收标准

### 10.1 功能验收

- 用户可以录入一段通用客户资料。
- 系统可以基于资料生成结构化分析结果。
- 系统可以生成需求文档。
- 系统可以生成功能清单。
- 系统可以生成测试用例。
- 系统可以生成 UAT 表。
- 系统可以生成培训手册。
- 用户可以编辑和导出生成文档。
- 用户可以基于当前资料进行 AI 提问。

### 10.2 AI 输出验收

- AI 输出不绑定具体行业。
- AI 输出不编造资料中没有的事实。
- 不确定内容进入待确认问题。
- 生成内容结构清晰，适合交付场景使用。
- Mock AI 内容也必须保持通用。

### 10.3 UI 验收

- 首屏能看出核心流程：输入资料、AI 分析、生成文档、AI 提问。
- 页面信息不应驳杂。
- 不应出现行业化演示内容。
- 不应以复杂项目管理看板作为核心体验。
- 文档预览和编辑区域应是主要视觉中心。

## 11. 推荐开发顺序

1. 重构数据模型为资料、分析结果、生成文档、聊天消息。
2. 重做首页为通用 AI 文档工作台。
3. 实现资料输入和 AI 分析。
4. 实现五类文档生成：需求文档、功能清单、测试用例、UAT 表、培训手册。
5. 实现文档中心、编辑和 Markdown 导出。
6. 实现基于当前资料的 AI 问答。
7. 清理行业化 seed 数据和项目管理看板。
8. 打磨 README、截图和作品集说明。

## 12. 简历描述参考

DeliverMate AI 是一个通用 AI 交付文档生成平台，支持将客户访谈、会议纪要和业务背景等非结构化资料自动转化为需求文档、功能清单、测试用例、UAT 表和培训手册，并支持基于资料的 AI 问答。项目使用 Next.js、TypeScript、SQLite/Prisma 和可切换 AI Provider 实现，重点展示需求分析、文档生成和 LLM 工作流设计能力。
