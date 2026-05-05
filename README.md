# DeliverMate AI

> 让零散客户资料变成可协作、可交付、可追溯的项目文档。  
> Turn raw customer materials into structured, collaborative delivery outputs.

## 中文介绍

DeliverMate AI 是一个面向项目交付、需求整理、实施咨询与文档产出的 AI 工作台。

它适合这样的场景：

- 客户访谈记录很多，但需求信息零散
- 会议纪要、业务背景、调研笔记难以快速整理成正式交付物
- 需要从原始资料中提炼需求、功能点、测试场景和 UAT 内容
- 希望围绕资料与文档继续做 AI 问答，而不是只做一次性生成

DeliverMate 的核心目标不是做一个“万能项目管理系统”，而是帮助团队把非结构化输入更快转成：

- 结构化分析结果
- 可编辑的需求文档
- 功能清单
- 测试用例
- UAT 表
- 培训手册
- 可检索的知识库上下文

## 页面截图

### 工作台首页

![DeliverMate 工作台首页](./public/screenshots/workbench-home.png)

### 知识库页面

![DeliverMate 知识库页面](./public/screenshots/knowledge-base.png)

## 当前功能

- 文本资料录入
- PDF / DOCX 上传与文本提取
- AI 资料分析
- 需求文档生成
- 功能清单生成
- 测试用例生成
- UAT 表生成
- 培训手册生成
- 文档编辑与 Markdown 导出
- 本地知识库同步
- 基于资料、生成文档和知识分块的 AI 问答

## 核心流程

当前推荐链路：

```text
原始资料
-> LLM 提取结构化 JSON
-> 本地 Schema 校验
-> 本地渲染交付文档
-> 沉淀为知识资产与分块
-> 继续问答 / 复用
```

这样设计的好处是把“事实提取”和“文档格式化”拆开，降低模型直接输出 Markdown 时的结构漂移风险。

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Prisma
- SQLite
- Vitest
- Playwright（用于本地页面截图与测试辅助）

## 本地启动

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

```bash
npm run db:generate
npm run db:migrate
```

### 3. 启动开发环境

```bash
npm run dev
```

打开：

- [http://localhost:3000](http://localhost:3000)

如果你希望局域网内其他设备访问：

```bash
npm run dev:network
```

然后使用你电脑真实的局域网 IP 访问，例如：

- `http://192.168.x.x:3000`

## 环境变量

复制 `.env.example` 到 `.env` 后填写真实值：

```env
DATABASE_URL="file:./dev.db"
AI_PROVIDER="deepseek"
DEEPSEEK_API_KEY="your-api-key"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
DEEPSEEK_MODEL="deepseek-v4-flash"
NEXT_PUBLIC_APP_NAME="DeliverMate AI"
```

### 可选：MetaGPT Bridge 模式

```env
AI_PROVIDER="metagpt"
METAGPT_PYTHON_PATH="python"
METAGPT_BRIDGE_SCRIPT="scripts/metagpt_bridge.py"
METAGPT_TIMEOUT_MS="180000"
METAGPT_ALLOW_DEEPSEEK_FALLBACK="true"
METAGPT_BACKEND="mock"
```

说明：

- 仓库不会包含真实 API Key
- `.env`、本地数据库、构建产物和缓存都已默认忽略
- `.env.example` 只提供安全示例配置

## 验证命令

```bash
npm test
npm run lint
npm run build
```

## 项目结构

- `src/app/`
  Next.js 路由与 API 路由
- `src/components/`
  工作台、知识库和共享 UI 组件
- `src/lib/ai/`
  AI provider 抽象、Schema、渲染器与 bridge 逻辑
- `src/lib/knowledge-base.ts`
  知识资产同步、切块和检索
- `src/lib/rag.ts`
  切块与关键词提取逻辑
- `prisma/`
  数据库 schema 与 seed
- `docs/`
  设计文档、计划与交接文档

## Roadmap

近期优先事项：

- 多人协作
- 工作空间与成员权限
- 评论 / 审核流程
- 文档版本历史
- 交付审批与交接链路

参考计划：

- [多人协作实施计划](./docs/superpowers/plans/2026-05-05-multiplayer-collaboration.md)

## English Summary

DeliverMate AI is an AI-assisted delivery workbench for consultants, delivery teams, and product operators.

It helps teams convert messy customer-facing inputs such as interview notes, meeting minutes, business context, and scattered requirements into:

- structured analysis
- editable requirements documents
- function lists
- test cases
- UAT tables
- training manuals
- reusable knowledge-base context

Recommended pipeline:

```text
Raw material
-> LLM extracts structured JSON
-> local validation
-> local document rendering
-> knowledge-base sync
-> follow-up AI Q&A
```

This keeps extraction and formatting separate, which makes the output more stable and easier to evolve.

## Notes

- The project currently uses SQLite for local development.
- There is still one existing `metagpt`-related Turbopack tracing warning during build. It is known and not caused by the current UI or README work.
