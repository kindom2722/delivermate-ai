# DeliverMate AI 项目初步规划 / PRD

## 1. 项目概述

### 1.1 项目名称

DeliverMate AI：面向企业交付顾问的需求到 UAT 自动化平台

### 1.2 项目定位

DeliverMate AI 是一个面向项目助理、FDE 交付顾问、IT 咨询顾问和企业数字化实施人员的 AI 交付工作台。它帮助用户将客户访谈、会议纪要、业务背景和零散需求，自动整理为结构化需求文档、功能方案、测试用例、UAT 清单、上线检查表和操作手册。

项目重点不是单纯展示 AI 聊天能力，而是模拟真实企业软件项目交付流程：从客户调研、需求分析、方案设计、系统配置、测试验证、UAT 到上线培训。

### 1.3 项目目标

- 展示对企业数字化项目交付流程的理解。
- 展示使用 AI 工具提升需求分析、文档生成、测试设计和交付效率的能力。
- 展示独立完成一个小型交付平台的产品设计、前后端开发、数据库建模和 AI 工作流集成能力。
- 服务作品集，应聘项目助理、FDE 交付顾问、IT 咨询、项目实施等岗位。

### 1.4 目标用户

- 项目助理
- FDE 交付顾问
- 软件实施顾问
- IT 咨询顾问
- 企业数字化项目经理
- 需要整理客户需求和交付文档的产品/运营人员

### 1.5 核心场景

用户拿到客户访谈记录或会议纪要后，将文本上传到平台。系统通过 AI 分析内容，自动提取客户背景、业务痛点、功能需求、流程节点、待确认问题，并进一步生成需求文档、功能方案、测试用例、UAT 清单和上线交付材料。

## 2. JD 能力映射

本项目对应岗位 JD 中的关键能力点：

| JD 能力要求 | 项目中的体现 |
| --- | --- |
| 参与客户需求调研与需求分析 | 访谈文本解析、需求提取、待确认问题生成 |
| 输出功能设计方案 | 自动生成功能模块、业务流程、字段设计和验收标准 |
| 参与系统测试和 UAT | 自动生成测试用例、UAT 清单、测试状态追踪 |
| 协助上线准备与配置 | 上线检查清单、基础数据准备清单、交付状态看板 |
| 使用 AI 工具提升效率 | LLM 文档生成、需求拆解、测试用例生成、会议纪要总结 |
| 搭建标准化交付资产 | 模板库、文档导出、交付资产沉淀 |
| 逻辑思维和沟通表达 | 需求追踪矩阵、文档结构化、问题清单 |

## 3. 产品范围

### 3.1 MVP 范围

第一版建议完成以下功能：

1. 项目空间管理
2. 客户访谈/会议纪要录入
3. AI 需求提取
4. AI 生成 PRD/需求说明
5. AI 生成测试用例
6. AI 生成 UAT 清单
7. 需求-测试追踪矩阵
8. 交付进度看板
9. Markdown 文档导出

### 3.2 增强版范围

如果时间充足，可以扩展：

1. 文件上传：支持 PDF、Word、TXT、Markdown
2. 知识库问答：基于客户资料进行 RAG 问答
3. 多模板文档生成：PRD、SRS、测试报告、培训手册、上线报告
4. AI 风险识别：自动识别需求不清晰、缺少验收标准、流程冲突等问题
5. 操作手册生成：根据功能模块生成用户培训材料
6. 流程图生成：根据需求自动生成 Mermaid 流程图
7. 多角色协作：项目经理、顾问、测试人员、客户确认人

### 3.3 非目标范围

MVP 阶段不建议做：

- 完整企业级权限体系
- 复杂实时协作编辑
- 完整低代码平台
- 真正对接企业内部系统
- 大规模多租户计费系统
- 高复杂度工作流引擎

## 4. 功能设计

### 4.1 项目空间管理

#### 功能说明

用户可以创建一个客户交付项目，每个项目下保存该客户的访谈记录、需求文档、测试用例、UAT 清单和交付资产。

#### 核心字段

- 项目名称
- 客户名称
- 客户行业
- 项目阶段
- 项目负责人
- 创建时间
- 最近更新时间
- 项目描述

#### 项目阶段

- 需求调研
- 方案设计
- 系统配置
- 内部测试
- UAT
- 上线准备
- 已上线

### 4.2 访谈/会议纪要录入

#### 功能说明

用户可以粘贴客户访谈内容、会议纪要或业务背景说明。系统将其作为 AI 分析的原始输入。

#### 输入内容

- 客户背景
- 当前业务流程
- 当前痛点
- 期望目标
- 已提到的功能需求
- 关键角色
- 业务限制
- 未明确的问题

#### 输出结果

- 结构化摘要
- 需求候选列表
- 待确认问题
- 涉及角色
- 涉及流程

### 4.3 AI 需求提取

#### 功能说明

系统调用 LLM，将原始访谈内容拆解成标准化需求项。

#### 每条需求包含

- 需求标题
- 需求描述
- 业务背景
- 用户角色
- 优先级
- 需求类型
- 验收标准
- 风险点
- 待确认问题

#### 需求类型

- 功能需求
- 数据需求
- 流程需求
- 权限需求
- 报表需求
- 集成需求
- 非功能需求

### 4.4 AI 生成需求文档

#### 功能说明

用户选择一个项目后，可以基于已提取的需求自动生成 PRD 或需求说明书。

#### 文档结构

- 项目背景
- 客户现状
- 业务痛点
- 项目目标
- 用户角色
- 功能范围
- 功能需求详情
- 业务流程
- 数据字段建议
- 权限说明
- 验收标准
- 待确认问题

### 4.5 AI 生成测试用例

#### 功能说明

系统根据需求项自动生成测试用例，帮助交付人员准备系统测试和 UAT。

#### 测试用例字段

- 用例编号
- 关联需求
- 测试场景
- 前置条件
- 操作步骤
- 预期结果
- 优先级
- 测试类型
- 执行状态

#### 测试类型

- 功能测试
- 流程测试
- 权限测试
- 数据校验测试
- 异常场景测试
- UAT 测试

### 4.6 UAT 清单

#### 功能说明

系统将需求和测试用例转化为面向客户确认的 UAT 清单。

#### UAT 清单字段

- UAT 项目
- 业务场景
- 客户确认人
- 操作路径
- 验收标准
- 当前状态
- 备注

#### UAT 状态

- 未开始
- 进行中
- 已通过
- 未通过
- 待客户确认

### 4.7 需求-测试追踪矩阵

#### 功能说明

展示每条需求是否已经生成测试用例、是否进入 UAT、是否通过验收。

#### 核心价值

- 证明需求没有遗漏。
- 证明测试覆盖了业务场景。
- 帮助交付人员发现风险。
- 体现项目管理和交付闭环能力。

#### 页面字段

- 需求编号
- 需求标题
- 优先级
- 关联测试用例数量
- UAT 状态
- 风险提示

### 4.8 交付进度看板

#### 功能说明

以看板方式展示项目从需求调研到上线的状态。

#### 看板列

- 需求待确认
- 方案设计中
- 待配置
- 待测试
- UAT 中
- 上线准备
- 已完成

#### 卡片内容

- 任务名称
- 所属需求
- 负责人
- 截止时间
- 当前状态
- 风险标签

### 4.9 文档导出

#### 功能说明

用户可以将 AI 生成的交付资产导出为 Markdown 文件。增强版可支持 Word 或 PDF。

#### 可导出内容

- 需求文档
- 功能设计方案
- 测试用例清单
- UAT 清单
- 上线检查表
- 培训操作手册

## 5. 页面设计

### 5.1 页面列表

| 页面 | 说明 |
| --- | --- |
| 项目列表页 | 查看所有客户交付项目 |
| 项目详情页 | 查看项目摘要、阶段、文档和风险 |
| 资料录入页 | 输入客户访谈、会议纪要或业务背景 |
| AI 分析页 | 展示 AI 提取的需求、角色、流程和问题 |
| 需求管理页 | 查看、编辑、确认需求 |
| 测试用例页 | 查看 AI 生成的测试用例 |
| UAT 清单页 | 管理客户验收清单 |
| 追踪矩阵页 | 查看需求、测试、UAT 的覆盖关系 |
| 交付看板页 | 展示任务阶段和交付进展 |
| 文档中心页 | 查看和导出交付文档 |

### 5.2 推荐首屏

首屏建议直接做成工作台，而不是营销页。

推荐布局：

- 左侧：项目导航、文档中心、模板库
- 顶部：当前项目、阶段、AI 生成按钮
- 中间：项目交付状态、需求覆盖率、UAT 进度
- 右侧：AI 助手和待确认问题

## 6. 数据模型初稿

### 6.1 Project

```ts
type Project = {
  id: string;
  name: string;
  clientName: string;
  industry: string;
  stage: ProjectStage;
  owner: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};
```

### 6.2 SourceNote

```ts
type SourceNote = {
  id: string;
  projectId: string;
  title: string;
  content: string;
  sourceType: "interview" | "meeting" | "business_context" | "other";
  createdAt: string;
};
```

### 6.3 Requirement

```ts
type Requirement = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  role: string;
  type: "feature" | "data" | "workflow" | "permission" | "report" | "integration" | "non_functional";
  priority: "high" | "medium" | "low";
  acceptanceCriteria: string[];
  risks: string[];
  openQuestions: string[];
  status: "draft" | "confirmed" | "changed" | "rejected";
};
```

### 6.4 TestCase

```ts
type TestCase = {
  id: string;
  projectId: string;
  requirementId: string;
  title: string;
  preconditions: string[];
  steps: string[];
  expectedResult: string;
  priority: "high" | "medium" | "low";
  type: "functional" | "workflow" | "permission" | "data" | "exception" | "uat";
  status: "not_run" | "passed" | "failed" | "blocked";
};
```

### 6.5 UATItem

```ts
type UATItem = {
  id: string;
  projectId: string;
  requirementId: string;
  scenario: string;
  acceptanceStandard: string;
  customerOwner?: string;
  status: "not_started" | "in_progress" | "passed" | "failed" | "waiting_customer";
  notes?: string;
};
```

### 6.6 GeneratedDocument

```ts
type GeneratedDocument = {
  id: string;
  projectId: string;
  title: string;
  documentType: "prd" | "solution" | "test_plan" | "uat" | "training_manual" | "launch_checklist";
  content: string;
  createdAt: string;
  updatedAt: string;
};
```

## 7. AI 功能设计

### 7.1 AI 能力清单

| AI 能力 | 输入 | 输出 |
| --- | --- | --- |
| 会议纪要总结 | 原始会议文本 | 结构化摘要、行动项、风险 |
| 需求提取 | 访谈/会议内容 | 需求列表、优先级、角色、验收标准 |
| 问题识别 | 需求草稿 | 待确认问题、缺失信息 |
| PRD 生成 | 需求列表 | 完整需求文档 |
| 测试用例生成 | 需求项 | 测试用例列表 |
| UAT 清单生成 | 需求和测试用例 | 客户验收清单 |
| 培训手册生成 | 功能模块 | 操作说明和培训材料 |
| 风险提示 | 项目数据 | 交付风险、需求遗漏、测试缺口 |

### 7.2 Prompt 设计原则

- 输入必须结构化，避免只把整段文本直接丢给模型。
- 输出必须要求 JSON，便于前端展示和数据库保存。
- 每次生成结果都保留原始输入、模型输出和人工编辑后的版本。
- AI 输出作为草稿，最终需求和验收标准需要用户确认。
- 对不确定内容必须输出 `openQuestions`，而不是编造。

### 7.3 示例 Prompt：需求提取

```text
你是一名企业软件项目交付顾问。请根据以下客户访谈内容，提取结构化需求。

要求：
1. 不要编造访谈中没有的信息。
2. 如果信息不完整，请放入 openQuestions。
3. 每条需求都需要包含用户角色、业务背景、需求描述、优先级、验收标准和风险点。
4. 输出 JSON 数组。

客户访谈内容：
{{source_note}}
```

### 7.4 示例 Prompt：测试用例生成

```text
你是一名软件测试工程师和 UAT 顾问。请根据以下需求生成测试用例。

要求：
1. 每条需求至少生成 2 条测试用例。
2. 覆盖正常流程、异常流程和权限/数据校验场景。
3. 每条测试用例包含前置条件、操作步骤和预期结果。
4. 输出 JSON 数组。

需求列表：
{{requirements}}
```

## 8. 技术栈建议

### 8.1 推荐技术栈

| 层级 | 技术 |
| --- | --- |
| 前端框架 | Next.js / React |
| UI | Tailwind CSS + shadcn/ui |
| 状态管理 | Zustand 或 React Query |
| 后端 | Next.js API Routes 或 NestJS |
| 数据库 | PostgreSQL |
| ORM | Prisma |
| AI 接入 | OpenAI API 或兼容 OpenAI 格式的模型服务 |
| 文档导出 | Markdown 优先，后续支持 DOCX/PDF |
| 文件解析 | 后续可接入 pdf-parse、mammoth 等 |
| 流程图 | Mermaid |
| 部署 | Vercel + Supabase / Railway |

### 8.2 MVP 技术选择

为了快速完成作品集，建议 MVP 使用：

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma
- PostgreSQL 或 SQLite
- OpenAI API
- Markdown 导出

如果希望降低部署复杂度，可以先使用 SQLite，本地跑通后再切换 PostgreSQL。

## 9. 环境要求

### 9.1 本地开发环境

- Node.js 20 或以上
- npm / pnpm / yarn 任一包管理器
- Git
- VS Code 或其他编辑器
- OpenAI API Key 或兼容模型服务 Key

### 9.2 可选依赖

- PostgreSQL 15 或以上
- Docker Desktop
- Supabase 本地或云端项目
- Vercel 账号

### 9.3 环境变量

```env
DATABASE_URL="postgresql://user:password@localhost:5432/delivermate"
OPENAI_API_KEY="your_api_key"
OPENAI_MODEL="gpt-4.1-mini"
NEXT_PUBLIC_APP_NAME="DeliverMate AI"
```

如果使用 SQLite：

```env
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="your_api_key"
OPENAI_MODEL="gpt-4.1-mini"
NEXT_PUBLIC_APP_NAME="DeliverMate AI"
```

## 10. API 设计初稿

### 10.1 项目 API

```text
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id
```

### 10.2 资料 API

```text
GET    /api/projects/:id/source-notes
POST   /api/projects/:id/source-notes
GET    /api/source-notes/:id
PATCH  /api/source-notes/:id
```

### 10.3 AI API

```text
POST /api/ai/extract-requirements
POST /api/ai/generate-prd
POST /api/ai/generate-test-cases
POST /api/ai/generate-uat
POST /api/ai/generate-training-manual
POST /api/ai/analyze-risks
```

### 10.4 文档 API

```text
GET  /api/projects/:id/documents
POST /api/projects/:id/documents
GET  /api/documents/:id/export
```

## 11. AI 执行步骤划分

这里的“AI 执行步骤”分为两类：系统内部 AI 工作流，以及你使用 AI 编程助手开发项目的步骤。

### 11.1 系统内部 AI 工作流

#### 工作流 A：从访谈内容到需求

1. 用户创建项目。
2. 用户粘贴客户访谈或会议纪要。
3. 系统清洗文本，去除明显无效内容。
4. AI 生成会议摘要、业务角色、流程节点和痛点。
5. AI 提取结构化需求列表。
6. AI 标记需求优先级、风险和待确认问题。
7. 用户人工确认或编辑需求。
8. 系统保存确认后的需求版本。

#### 工作流 B：从需求到 PRD

1. 用户选择已确认需求。
2. AI 根据项目背景和需求列表生成 PRD。
3. 系统展示文档草稿。
4. 用户编辑文档内容。
5. 系统保存最终版 PRD。
6. 用户导出 Markdown。

#### 工作流 C：从需求到测试用例

1. 用户选择一个或多个需求。
2. AI 为每条需求生成测试用例。
3. 系统将测试用例与需求编号关联。
4. 用户编辑测试步骤和预期结果。
5. 系统统计测试覆盖率。

#### 工作流 D：从测试用例到 UAT

1. 系统读取需求和测试用例。
2. AI 生成面向客户的 UAT 清单。
3. 用户指定客户确认人和验收日期。
4. 客户或模拟客户确认 UAT 状态。
5. 系统更新需求追踪矩阵。

#### 工作流 E：交付风险分析

1. 系统读取项目阶段、需求状态、测试状态和 UAT 状态。
2. AI 判断是否存在需求未确认、测试缺失、UAT 未覆盖、风险未解决等问题。
3. 系统生成风险提示。
4. 用户根据风险提示补充资料或推进确认。

### 11.2 使用 AI 编程助手开发项目的步骤

#### 第 1 阶段：项目初始化

目标：搭建基础工程。

AI 执行任务：

1. 创建 Next.js + TypeScript 项目。
2. 配置 Tailwind CSS 和基础 UI 组件。
3. 配置 Prisma。
4. 创建数据库 schema。
5. 创建基础路由和页面框架。

交付物：

- 可运行的前端项目
- 数据库连接
- 基础页面骨架

#### 第 2 阶段：项目和资料管理

目标：完成非 AI 的核心数据流。

AI 执行任务：

1. 实现项目 CRUD。
2. 实现客户资料/会议纪要录入。
3. 实现项目详情页。
4. 实现资料列表和详情查看。
5. 增加基础表单校验。

交付物：

- 项目列表页
- 项目详情页
- 资料录入页
- 数据持久化

#### 第 3 阶段：AI 需求提取

目标：完成第一个 AI 闭环。

AI 执行任务：

1. 封装 LLM 调用服务。
2. 编写需求提取 prompt。
3. 设计 JSON 输出 schema。
4. 实现 `/api/ai/extract-requirements`。
5. 在前端展示 AI 提取结果。
6. 支持用户确认、编辑和保存需求。

交付物：

- AI 需求提取接口
- 需求管理页面
- 需求确认流程

#### 第 4 阶段：文档生成

目标：让项目具备作品集展示价值。

AI 执行任务：

1. 编写 PRD 生成 prompt。
2. 编写功能方案生成 prompt。
3. 实现文档生成 API。
4. 实现文档中心页面。
5. 支持 Markdown 预览和导出。

交付物：

- PRD 生成
- 功能方案生成
- 文档中心
- Markdown 导出

#### 第 5 阶段：测试和 UAT

目标：体现交付闭环。

AI 执行任务：

1. 编写测试用例生成 prompt。
2. 编写 UAT 清单生成 prompt。
3. 实现测试用例页面。
4. 实现 UAT 清单页面。
5. 建立需求、测试用例、UAT 的关联关系。
6. 实现需求追踪矩阵。

交付物：

- 测试用例管理
- UAT 清单
- 需求追踪矩阵

#### 第 6 阶段：交付看板和风险提示

目标：提升项目完整度。

AI 执行任务：

1. 实现交付阶段看板。
2. 实现任务状态管理。
3. 根据项目数据生成风险提示。
4. 展示需求覆盖率、测试覆盖率、UAT 通过率。

交付物：

- 交付看板
- 风险提示
- 项目指标面板

#### 第 7 阶段：打磨作品集展示

目标：让项目适合放入简历和 GitHub。

AI 执行任务：

1. 编写 README。
2. 准备演示数据。
3. 生成项目截图。
4. 编写项目亮点说明。
5. 编写面试讲解稿。
6. 部署到 Vercel 或其他平台。

交付物：

- GitHub README
- 在线演示地址
- 项目截图
- 简历描述
- 面试讲解稿

## 12. 开发里程碑

### Milestone 1：基础平台

预计时间：2-3 天

- 完成项目初始化
- 完成项目 CRUD
- 完成资料录入
- 完成基础页面布局

### Milestone 2：AI 需求提取

预计时间：2-3 天

- 完成 LLM 调用
- 完成需求提取
- 完成需求管理
- 完成需求确认流程

### Milestone 3：文档生成

预计时间：2 天

- 完成 PRD 生成
- 完成功能方案生成
- 完成 Markdown 预览和导出

### Milestone 4：测试和 UAT

预计时间：3 天

- 完成测试用例生成
- 完成 UAT 清单
- 完成追踪矩阵

### Milestone 5：作品集打磨

预计时间：2-3 天

- 完成交付看板
- 完成演示数据
- 完成 README
- 完成部署
- 完成简历项目描述

## 13. 验收标准

### 13.1 功能验收

- 用户可以创建和管理客户项目。
- 用户可以录入客户访谈或会议纪要。
- 系统可以从文本中提取结构化需求。
- 用户可以确认和编辑需求。
- 系统可以根据需求生成 PRD。
- 系统可以根据需求生成测试用例。
- 系统可以生成 UAT 清单。
- 系统可以展示需求、测试、UAT 的追踪关系。
- 用户可以导出 Markdown 文档。

### 13.2 AI 输出验收

- AI 输出必须结构化。
- AI 输出不能覆盖用户已确认内容。
- AI 不确定的信息必须进入待确认问题。
- 每条需求至少有一个验收标准。
- 每条高优先级需求必须关联测试用例。

### 13.3 作品集验收

- GitHub README 能说明项目背景、功能、技术栈和启动方式。
- 项目有至少 3 张清晰截图。
- 项目有一组完整演示数据。
- 项目能演示从会议纪要到需求、PRD、测试用例、UAT 的完整流程。
- 简历中能用 2-3 行说明项目价值。

## 14. README 展示建议

README 建议包含：

1. 项目简介
2. 为什么做这个项目
3. 目标岗位能力映射
4. 功能截图
5. 核心功能
6. 技术栈
7. AI 工作流
8. 本地启动方式
9. 演示数据
10. 后续优化方向

## 15. 简历描述参考

可以写成：

> DeliverMate AI 是一个面向企业软件交付场景的 AI 工作台，支持从客户访谈和会议纪要中自动提取需求、生成 PRD、测试用例、UAT 清单和上线检查表。项目使用 Next.js、TypeScript、Prisma 和 LLM API 实现，重点模拟 FDE 交付顾问在需求调研、方案设计、测试验收和上线准备中的完整工作流。

项目亮点：

- 设计需求、测试用例、UAT 的追踪矩阵，体现企业软件交付闭环。
- 使用 LLM 自动生成需求文档、测试用例和客户验收清单，提升交付效率。
- 结合项目看板、风险提示和文档中心，模拟真实客户交付流程。

## 16. 后续优化方向

- 接入 RAG 知识库，让 AI 基于客户历史资料回答问题。
- 支持 Word/PDF 文件上传和解析。
- 增加多人协作和客户确认链接。
- 增加行业模板，例如零售、餐饮、批发、教育、制造。
- 增加 Coze、Dify 或 n8n 风格的可视化 AI 工作流配置。
- 增加自动生成 Mermaid 业务流程图。
- 增加多模型切换和生成质量评分。

## 17. 当前未决问题

- 是否优先使用 SQLite 还是 PostgreSQL。
- 是否需要登录系统。
- 是否需要支持文件上传，还是 MVP 只支持文本粘贴。
- 是否需要真实调用 OpenAI API，还是先用 mock 数据完成前端流程。
- 作品集演示行业应选择零售、餐饮、批发还是通用企业软件交付。

## 18. 推荐 MVP 开发顺序

如果目标是尽快做出可展示作品，推荐顺序如下：

1. 先做项目管理和资料录入。
2. 再做 AI 需求提取。
3. 再做 PRD 生成。
4. 再做测试用例和 UAT。
5. 最后做交付看板和视觉打磨。

最小可展示闭环：

```text
创建项目 -> 粘贴会议纪要 -> AI 提取需求 -> AI 生成 PRD -> AI 生成测试用例 -> 展示追踪矩阵 -> 导出 Markdown
```

只要这个闭环跑通，就已经很贴合岗位 JD。
