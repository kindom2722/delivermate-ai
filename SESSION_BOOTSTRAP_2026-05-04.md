# DeliverMate Session Bootstrap

## 项目概览

DeliverMate 是一个基于 Next.js + Prisma + SQLite 的交付工作台，用来把客户访谈、会议纪要、业务背景和零散需求整理为可评审、可确认、可导出的交付文档。

当前主线能力：

- 录入文本资料
- 上传 PDF / DOCX 并抽取文本
- 运行 AI 结构化分析
- 生成需求文档、功能清单、测试用例、UAT 表、培训手册
- 编辑和导出 Markdown 文档
- 基于本地知识库进行后续问答

## 关键决策

### 1. AI 分析和文档渲染分离

当前采用两段式链路，而不是让模型直接输出完整 Markdown：

```text
原始资料 -> AI 输出结构化 JSON -> 本地校验 -> 本地 Markdown 渲染
```

这样做的原因：

- 降低模型直接输出 Markdown 时的结构漂移
- 保证不同文档类型的格式稳定
- 便于替换模型或追加行业模板

### 2. Provider 选择走配置，不进入业务逻辑

当前 provider 边界位于 `src/lib/ai`，有两个实现：

- `MockAIProvider`
- `DeepSeekProvider`

实际规则：

- 只有在 `AI_PROVIDER=deepseek` 且 `DEEPSEEK_API_KEY` 可用时，才真正启用 DeepSeek
- 其余情况统一回退到 Mock，并在 UI 中显示为 `Mock AI`

### 3. RAG 走本地知识资产模型

当前不依赖外部向量数据库，而是基于 SQLite + Prisma 使用两层模型：

- `KnowledgeAsset`
- `KnowledgeChunk`

知识资产分两类：

- `submission:*`：原始提交资料
- `generated_document`：生成文档

### 4. 一份资料允许存在多份原始资产和多份生成文档资产

当前唯一性规则已经修正为：

- 生成文档资产由 `generatedDocumentId` 唯一标识
- 原始提交资产由 `(sourceMaterialId, submissionKey)` 唯一标识

这意味着：

- 同一份资料可以不断追加上传文件
- 同一份资料可以生成多份不同文档并都进入知识库

### 5. 知识资产在写入边界自动同步

以下动作会自动触发知识资产 / chunk 重建：

- 创建资料
- 更新资料
- 上传文件并并入已有资料
- 生成文档
- 编辑文档

## 当前整体架构思路

### 前端

- Next.js App Router
- React Client Components
- Tailwind CSS

主页面组织为一个工作台，包含：

- 资料列表与新建区
- 文件上传区
- AI 分析区
- 文档生成与编辑区
- Knowledge Library
- 浮动 AI 问答助手

### 后端

主要 API：

- `/api/source-materials`
- `/api/source-materials/[id]`
- `/api/ai/analyze-material`
- `/api/ai/generate-document`
- `/api/ai/chat`
- `/api/documents/[id]`
- `/api/documents/[id]/export`

### 数据层

核心模型：

- `SourceMaterial`
- `AnalysisResult`
- `GeneratedDocument`
- `ChatMessage`
- `KnowledgeAsset`
- `KnowledgeChunk`

### 数据流

1. 用户录入文本或上传文件
2. 后端创建或更新 `SourceMaterial`
3. 后端同步一个或多个 `KnowledgeAsset`
4. 后端把资产切成 `KnowledgeChunk`
5. 用户触发 AI 分析
6. 后端生成 `AnalysisResult`
7. 用户生成文档
8. 后端创建 `GeneratedDocument`
9. 后端同步文档资产进入知识库
10. 聊天接口从原始资产和生成文档资产中召回片段，再喂给 provider

## 已完成部分

### 资料录入与上传

- 文本资料录入已完成
- PDF / DOCX 上传已完成
- 上传文本抽取已完成
- 上传文件可并入当前资料，也可单独新建资料

### AI 分析

- 分析接口已完成
- 分析结果可落库
- 当前 provider 标签会在 UI 中显示
- DeepSeek 长文本已增加摘要预处理、缩短重试和 mock 回退

### 文档生成

- 可生成 5 类交付文档
- 可编辑生成文档
- 可导出 Markdown
- 可删除文档

### RAG / 知识库

- 已有本地切块与关键词抽取
- 原始资料与生成文档都能进入知识库
- 问答已基于知识片段召回
- 多份生成文档资产约束问题已修复

### 前端整理

- 页面中文乱码已大面积修复
- 主要提示文案、模板字符串、handoff 文档已恢复可读
- 主工作台版式已收敛，信息层级比之前清晰

### 质量状态

本轮已验证通过：

- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:seed`
- `npm test`
- `npm run lint`
- `npm run build`

## 待办事项

### 高优先级

- 为 AI 问答增加可见引用和来源说明
- 为 Knowledge Library 增加筛选和搜索
- 为知识资产卡片补充更清晰的元信息

### 中优先级

- 增强长文本分析，不只依赖摘要压缩 + 重试
- 增强需求、功能、测试、UAT 之间的 traceability
- 增加生成文档历史版本或版本视图

### 低优先级 / 后续演进

- 引入 embeddings 检索层
- 增加 DOCX / PDF 导出
- 增加跨资料检索模式

## 重要文件修改记录

### 本轮重点修改文件

- `src/components/workspace-client.tsx`
  - 重新梳理主工作台布局
  - 修复大量用户可见乱码
  - 保留浮动 AI 助手，但减轻对主工作区的压迫

- `src/components/app-shell.tsx`
  - 重做顶部壳层与导航文案

- `src/app/globals.css`
  - 重整页面基础视觉风格
  - 收敛背景、阴影和悬浮面板行为

- `src/lib/ai/provider.ts`
  - 修复 DeepSeek 启用条件
  - 让 provider label 与真实可用状态一致

- `src/lib/ai/deepseek-provider.ts`
  - 修复乱码提示词
  - 修复长文本压缩提示文案
  - 保留长文本回退链路

- `src/lib/ai/mock-provider.ts`
  - 修复 mock 输出中的乱码与损坏插值

- `src/lib/ai/document-renderer.ts`
  - 重写交付文档模板文案
  - 修复需求 / 功能 / 测试 / UAT / 培训文档结构输出

- `src/lib/knowledge-base.ts`
  - 修正 submission / generated_document 资产同步逻辑
  - 引入 `submissionKey`

- `prisma/schema.prisma`
  - 修复 `KnowledgeAsset` 唯一约束设计

- `scripts/init-db.ts`
  - 与当前 Prisma schema 重新对齐

- `src/app/api/source-materials/route.ts`
  - 修复上传资料并入现有资料的逻辑
  - 对接新的 submission asset 规则

- `src/app/api/ai/generate-document/route.ts`
  - 统一错误处理
  - 对接新的 generated document asset 同步逻辑

- `src/app/api/ai/chat/route.ts`
  - 统一错误处理

- `README.md`
  - 重写为当前真实状态说明

- `PROJECT_HANDOFF.md`
  - 重写为最新英文交接基线

- `docs/project-handoff-2026-05-04.md`
  - 重写为当前可读中文交接说明

- `docs/document-generation-standards.md`
  - 重写为可继续复用的文档生成规范

## 当前已知风险

### 1. Windows 下 Prisma 仍可能有文件锁问题

若 `npm run db:generate` 再次出现 `EPERM`：

- 先停掉占用 Prisma engine 的 Node 进程
- 再重新执行生成

### 2. DeepSeek 长文本分析仍是“稳定降级”，不是“彻底解决”

当前已经避免接口直接 500，但长文本质量仍可能下降。

### 3. 问答可解释性还不够强

当前虽然会用知识片段回答，但 UI 里还没有把“引用了哪份资产、哪段 chunk”展示给用户。

## 下次会话建议起手点

如果下次重点做知识库 / 问答：

1. `src/lib/knowledge-base.ts`
2. `src/app/api/ai/chat/route.ts`
3. `src/components/workspace-client.tsx`

如果下次重点做数据 / 迁移：

1. `prisma/schema.prisma`
2. `scripts/init-db.ts`
3. `prisma/seed.ts`

如果下次重点做产品完善：

1. 给聊天结果加引用来源
2. 给 Knowledge Library 加筛选 / 搜索
3. 做长文本分段分析与聚合

## 快速加载建议

下次会话如果要快速接上上下文，建议先读：

1. `SESSION_BOOTSTRAP_2026-05-04.md`
2. `PROJECT_HANDOFF.md`
3. `README.md`

再按任务方向进入对应代码：

- UI：`src/components/workspace-client.tsx`
- AI：`src/lib/ai/deepseek-provider.ts`
- RAG：`src/lib/knowledge-base.ts`
- Schema：`prisma/schema.prisma`
