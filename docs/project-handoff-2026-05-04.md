# DeliverMate AI 项目交接说明

## 项目目标

DeliverMate AI 面向交付顾问、项目助理和实施顾问，核心目标不是做一个泛用聊天页面，而是把客户的原始资料整理为可交付、可评审、可追问的标准文档。

当前产品方向：

- 录入客户访谈、会议纪要、业务背景或零散需求
- 先做结构化 AI 分析
- 再生成需求文档、功能清单、测试用例、UAT 表和培训手册
- 支持后续问答、文档编辑和 Markdown 导出
- 用本地知识库保存原始提交与生成文档，供 RAG 问答检索

## 关键实现决策

### 1. AI 分析与文档渲染分离

当前采用两段式链路，而不是让模型直接输出完整 Markdown：

```text
原始资料 -> AI 输出结构化 JSON -> 本地校验 -> 本地 Markdown 渲染
```

这样做的原因：

- 降低模型直接写 Markdown 时的结构漂移
- 保证需求文档、功能清单、UAT 等格式稳定
- 便于后续替换模型或补行业模板

### 2. 当前真实模型使用 DeepSeek

真实 provider 由环境变量控制：

- `AI_PROVIDER=deepseek`
- `DEEPSEEK_API_KEY`
- `DEEPSEEK_BASE_URL`
- `DEEPSEEK_MODEL`

默认推荐模型：

- `deepseek-v4-flash`

若未配置可用 key，则自动回退到 `MockAIProvider`。

### 3. RAG 走本地知识资产模型

当前 RAG 不依赖外部向量库，而是使用 SQLite + Prisma 上的本地知识资产模型：

- `KnowledgeAsset`
- `KnowledgeChunk`

知识资产分两类：

- `submission:*`：原始提交资料
- `generated_document`：生成后的文档

### 4. 自动同步知识资产

以下写入边界会自动重建知识资产 / chunks：

- 创建 source material
- 更新 source material
- 上传文件并并入已有资料
- 创建 generated document
- 编辑 generated document

## 当前架构

### 前端

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS

主要页面由一个工作台组成：

- 资料列表与录入
- 文件上传
- AI 分析区
- 文档生成与编辑区
- Knowledge Library
- 浮动 AI 问答助手

### 后端 API

- `/api/source-materials`
- `/api/source-materials/[id]`
- `/api/ai/analyze-material`
- `/api/ai/generate-document`
- `/api/ai/chat`
- `/api/documents/[id]`
- `/api/documents/[id]/export`

### 数据模型

- `SourceMaterial`
- `AnalysisResult`
- `GeneratedDocument`
- `ChatMessage`
- `KnowledgeAsset`
- `KnowledgeChunk`

其中：

- `generatedDocumentId` 用于唯一定位生成文档资产
- `submissionKey` 用于唯一定位同一份资料下的不同原始提交资产

## 当前已完成能力

### 已完成

- 文本资料录入
- PDF / DOCX 上传与文本抽取
- DeepSeek / Mock 双 provider 切换
- 结构化分析落库
- 需求文档、功能清单、测试用例、UAT 表、培训手册生成
- 文档编辑与 Markdown 导出
- 基于本地知识资产的问答
- 知识资产按原始提交与生成文档分组展示
- 浮动、可拖动的 AI 问答面板

### 最新修复

- 清理了页面中文乱码
- 修复了损坏的模板字符串插值
- 修复了 DeepSeek 缺 key 时仍显示已启用的问题
- 修复了 `KnowledgeAsset` 约束导致一份资料无法拥有多份生成文档资产的问题
- 让 `schema.prisma`、`init-db.ts` 与运行时逻辑重新对齐

## 仍需关注的问题

### 1. Windows 下 `prisma generate` 可能遇到文件锁

已观察到 `query_engine-windows.dll.node` 的 `EPERM` 重命名问题。若再次出现：

- 先停止占用 Prisma engine 的 Node 进程
- 再重新执行 `npm run db:generate`

### 2. 长文本分析仍是“稳定降级”，不是“完美解决”

当前对长文本做了：

- 摘要预处理
- 多轮缩短尝试
- 失败后回退到 mock 草稿

这能避免 500，但不代表长文本分析质量已经完全理想。

### 3. 仍缺更强的引用与检索展示

当前问答已使用知识片段，但还没有在 UI 中明确展示引用来源、chunk 编号和证据归属。

## 推荐下一步

1. 为 AI 问答增加可见引用与来源说明。
2. 为 Knowledge Library 增加筛选和搜索。
3. 为长文本分析增加分段分析与聚合能力，而不是只依赖压缩摘要。
4. 为生成文档补充历史版本或 traceability 视图。

## 关键文件

- `src/components/workspace-client.tsx`
  主工作台 UI，包含资料录入、分析、文档编辑、知识库展示和浮动问答。

- `src/lib/knowledge-base.ts`
  知识资产同步、切块与检索逻辑。

- `src/lib/ai/deepseek-provider.ts`
  DeepSeek 调用、长文本降级、JSON 修复。

- `src/lib/ai/document-renderer.ts`
  结构化分析结果到 Markdown 文档的本地渲染。

- `prisma/schema.prisma`
  当前数据模型。

- `scripts/init-db.ts`
  本地 SQLite 初始化脚本。
