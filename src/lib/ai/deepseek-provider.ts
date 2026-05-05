import { z } from "zod";
import { renderDocument } from "./document-renderer";
import { MockAIProvider } from "./mock-provider";
import { analysisPayloadSchema } from "./schemas";
import type {
  AIProvider,
  AnalysisPayload,
  FunctionCandidate,
  GeneratedDocumentType,
  RequirementCandidate,
  SourceMaterialType,
} from "./types";

const deepSeekResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string().nullable().optional(),
        }),
      }),
    )
    .min(1),
});

const analysisSchemaExample = JSON.stringify(
  {
    summary: "一句话总结当前资料的核心交付目标",
    background: "背景说明",
    goals: ["目标一"],
    painPoints: ["痛点一"],
    roles: ["角色一"],
    processNotes: ["流程备注一"],
    requirementCandidates: [
      {
        title: "需求标题",
        description: "需求描述",
        role: "提出或使用该需求的角色",
        priority: "high",
        acceptanceCriteria: ["验收标准一"],
        openQuestions: ["待确认问题一"],
      },
    ],
    functionCandidates: [
      {
        name: "功能名称",
        description: "功能描述",
        role: "相关角色",
        priority: "medium",
        inputs: ["输入一"],
        outputs: ["输出一"],
        businessRules: ["业务规则一"],
        openQuestions: ["待确认问题一"],
      },
    ],
    risks: ["风险一"],
    openQuestions: ["总体待确认问题一"],
  },
  null,
  2,
);

const documentTypePromptLabels: Record<GeneratedDocumentType, string> = {
  requirements_doc: "需求文档",
  function_list: "功能清单",
  test_cases: "测试用例",
  uat_table: "UAT 表",
  training_manual: "培训手册",
};

function getEnv(name: string, fallback = ""): string {
  const value = process.env[name]?.trim();
  return value || fallback;
}

export function extractJsonObject(raw: string) {
  const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) return fencedMatch[1].trim();

  const start = raw.indexOf("{");
  if (start < 0) return raw.trim();

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < raw.length; index += 1) {
    const char = raw[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;

    if (depth === 0) {
      return raw.slice(start, index + 1).trim();
    }
  }

  return raw.slice(start).trim();
}

export function buildAnalysisSource(content: string, maxLength = 6000) {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  if (normalized.length <= maxLength) return normalized;

  const headLength = Math.floor(maxLength * 0.72);
  const tailLength = Math.max(600, maxLength - headLength);
  const omitted = normalized.length - headLength - tailLength;

  return [
    normalized.slice(0, headLength).trim(),
    "",
    `[中间内容已省略，原文较长，此处跳过约 ${omitted} 个字符以提升结构化分析稳定性]`,
    "",
    normalized.slice(normalized.length - tailLength).trim(),
  ].join("\n");
}

function normalizeRootObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;

  const record = value as Record<string, unknown>;
  const nestedKeys = ["analysis", "payload", "result", "data"];

  for (const key of nestedKeys) {
    const nested = record[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return nested;
    }
  }

  return value;
}

function normalizePriority(value: string | undefined): "high" | "medium" | "low" {
  const normalized = value?.trim().toLowerCase() ?? "";

  if (/^high$|p1|高/.test(normalized)) return "high";
  if (/^low$|p3|低/.test(normalized)) return "low";
  return "medium";
}

function parseListValue(value: string) {
  return value
    .split(/[；;、]/)
    .map((item) => cleanupLine(item))
    .filter(Boolean);
}

function cleanupLine(line: string) {
  return line
    .replace(/^\s*[-*]\s*/, "")
    .replace(/^\s*\d+\.\s*/, "")
    .trim();
}

function parseBulletItems(block: string) {
  return block
    .split(/\r?\n/)
    .map((line) => cleanupLine(line))
    .filter((line) => Boolean(line) && !line.startsWith("#"));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractMarkdownSection(markdown: string, names: string[]) {
  for (const name of names) {
    const pattern = new RegExp(
      String.raw`(?:^|\n)##\s*${escapeRegExp(name)}\s*\n([\s\S]*?)(?=\n##\s+|\n#\s+|$)`,
      "i",
    );
    const match = markdown.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return "";
}

function extractLabeledBlock(block: string, labels: string[]) {
  for (const label of labels) {
    const pattern = new RegExp(
      String.raw`(?:^|\n)-\s*${escapeRegExp(label)}[：:]\s*([\s\S]*?)(?=\n-\s*[^-\n]+[：:]|\n###\s+|$)`,
      "i",
    );
    const match = block.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return "";
}

function parseScalarFromBlock(block: string, labels: string[]) {
  const value = extractLabeledBlock(block, labels)
    .split(/\r?\n/)[0]
    ?.trim();
  return value || "";
}

function parseListFromBlock(block: string, labels: string[]) {
  const extracted = extractLabeledBlock(block, labels);
  if (!extracted) return [];

  const inlineItems = parseListValue(extracted.split(/\r?\n/)[0] ?? "");
  const bulletItems = extracted
    .split(/\r?\n/)
    .slice(1)
    .map((line) => cleanupLine(line))
    .filter(Boolean);

  return [...inlineItems, ...bulletItems];
}

function parseRequirementCandidates(block: string): RequirementCandidate[] {
  if (!block) return [];

  const sections = block
    .split(/\n###\s+/)
    .map((item, index) => (index === 0 ? item.replace(/^###\s+/, "") : item))
    .map((item) => item.trim())
    .filter(Boolean);

  const candidates = sections
    .map<RequirementCandidate | null>((section) => {
      const [headingLine, ...restLines] = section.split(/\r?\n/);
      const body = restLines.join("\n").trim();
      const title = headingLine.replace(/^需求\s*\d+[：:]\s*/, "").trim();
      const description = parseScalarFromBlock(body, ["描述"]);
      const role = parseScalarFromBlock(body, ["角色"]);
      const acceptanceCriteria = parseListFromBlock(body, ["验收标准", "验收条件"]);
      const openQuestions = parseListFromBlock(body, ["待确认", "待确认问题"]);

      if (!title || !description) return null;

      return {
        title,
        description,
        priority: normalizePriority(parseScalarFromBlock(body, ["优先级"])),
        acceptanceCriteria,
        openQuestions,
        ...(role ? { role } : {}),
      } satisfies RequirementCandidate;
    })
    .filter((item): item is RequirementCandidate => Boolean(item));

  return candidates;
}

function parseFunctionCandidates(block: string): FunctionCandidate[] {
  if (!block) return [];

  const sections = block
    .split(/\n###\s+/)
    .map((item, index) => (index === 0 ? item.replace(/^###\s+/, "") : item))
    .map((item) => item.trim())
    .filter(Boolean);

  const candidates = sections
    .map<FunctionCandidate | null>((section) => {
      const [headingLine, ...restLines] = section.split(/\r?\n/);
      const body = restLines.join("\n").trim();
      const name = headingLine.replace(/^功能\s*\d+[：:]\s*/, "").trim();
      const description = parseScalarFromBlock(body, ["描述"]);
      const role = parseScalarFromBlock(body, ["角色"]);

      if (!name || !description) return null;

      return {
        name,
        description,
        priority: normalizePriority(parseScalarFromBlock(body, ["优先级"])),
        inputs: parseListFromBlock(body, ["输入"]),
        outputs: parseListFromBlock(body, ["输出"]),
        businessRules: parseListFromBlock(body, ["业务规则", "规则"]),
        openQuestions: parseListFromBlock(body, ["待确认", "待确认问题"]),
        ...(role ? { role } : {}),
      } satisfies FunctionCandidate;
    })
    .filter((item): item is FunctionCandidate => Boolean(item));

  return candidates;
}

export function parseMarkdownAnalysis(markdown: string): AnalysisPayload {
  const summaryBlock = extractMarkdownSection(markdown, ["分析摘要", "摘要"]);
  const backgroundBlock = extractMarkdownSection(markdown, ["业务背景", "背景"]);

  const summary = summaryBlock.split(/\r?\n/).map(cleanupLine).find(Boolean) ?? "待补充分析摘要";
  const background = backgroundBlock.split(/\r?\n/).map(cleanupLine).find(Boolean) ?? "待补充业务背景";

  return analysisPayloadSchema.parse({
    summary,
    background,
    goals: parseBulletItems(extractMarkdownSection(markdown, ["业务目标", "目标"])),
    painPoints: parseBulletItems(extractMarkdownSection(markdown, ["当前痛点", "痛点"])),
    roles: parseBulletItems(extractMarkdownSection(markdown, ["关键角色", "角色"])),
    processNotes: parseBulletItems(extractMarkdownSection(markdown, ["流程备注", "流程说明"])),
    requirementCandidates: parseRequirementCandidates(
      extractMarkdownSection(markdown, ["候选需求", "需求候选"]),
    ),
    functionCandidates: parseFunctionCandidates(
      extractMarkdownSection(markdown, ["候选功能", "功能候选"]),
    ),
    risks: parseBulletItems(extractMarkdownSection(markdown, ["风险", "交付风险"])),
    openQuestions: parseBulletItems(extractMarkdownSection(markdown, ["待确认问题", "待确认项"])),
  });
}

export class DeepSeekProvider implements AIProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly fallback = new MockAIProvider();

  constructor(config?: { apiKey?: string; baseUrl?: string; model?: string }) {
    this.apiKey = config?.apiKey ?? getEnv("DEEPSEEK_API_KEY", "");
    this.baseUrl = config?.baseUrl ?? getEnv("DEEPSEEK_BASE_URL", "https://api.deepseek.com");
    this.model = config?.model ?? getEnv("DEEPSEEK_MODEL", "deepseek-v4-flash");

    if (!this.apiKey) {
      throw new Error("DEEPSEEK_API_KEY is not configured.");
    }
  }

  private async createChatCompletion(input: {
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
    responseFormat?: { type: "json_object" };
    temperature?: number;
    maxTokens?: number;
  }) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: input.messages,
        response_format: input.responseFormat,
        temperature: input.temperature ?? 0.2,
        max_tokens: input.maxTokens ?? 1800,
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        payload && typeof payload === "object" && "error" in payload
          ? JSON.stringify((payload as { error: unknown }).error)
          : `DeepSeek request failed with status ${response.status}`;
      throw new Error(message);
    }

    return deepSeekResponseSchema.parse(payload);
  }

  private async requestText(input: {
    system: string;
    user: string;
    maxTokens?: number;
    temperature?: number;
  }) {
    const response = await this.createChatCompletion({
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
      maxTokens: input.maxTokens,
      temperature: input.temperature ?? 0.2,
    });

    const raw = response.choices[0]?.message.content?.trim();
    if (!raw) {
      throw new Error("DeepSeek returned empty text content.");
    }

    return raw;
  }

  private async summarizeForAnalysis(input: {
    title: string;
    type: SourceMaterialType;
    content: string;
  }) {
    return this.requestText({
      system:
        "你是一名资深需求分析顾问。请将长篇访谈或资料压缩为适合后续结构化提取的专业中文摘要。不要输出 JSON，不要展示推理过程，只输出可复用的结构化文字笔记。",
      user: `请将下面资料压缩为一份适合需求分析的摘要，控制在 900 字以内。
资料标题：${input.title}
资料类型：${input.type}

原始资料：
${buildAnalysisSource(input.content, 5200)}

输出格式：
背景：
目标：
关键角色：
痛点：
关键流程：
明确需求线索：
待确认问题：
风险或约束：`,
      maxTokens: 1400,
      temperature: 0.2,
    });
  }

  private parseStructuredJson<T>(input: {
    raw: string;
    schema: z.ZodSchema<T>;
  }) {
    const parsed = JSON.parse(extractJsonObject(input.raw)) as unknown;
    return input.schema.parse(normalizeRootObject(parsed));
  }

  private async requestJson<T>(input: {
    system: string;
    user: string;
    schema: z.ZodSchema<T>;
    maxTokens?: number;
  }) {
    const response = await this.createChatCompletion({
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
      responseFormat: { type: "json_object" },
      maxTokens: input.maxTokens,
      temperature: 0.1,
    });

    const raw = response.choices[0]?.message.content?.trim();
    if (!raw) {
      throw new Error("DeepSeek returned empty JSON content.");
    }

    try {
      return this.parseStructuredJson({ raw, schema: input.schema });
    } catch (error) {
      return this.repairJsonResponse({
        raw,
        schema: input.schema,
        errorMessage: error instanceof Error ? error.message : "Unknown JSON parse error",
      });
    }
  }

  private async repairJsonResponse<T>(input: {
    raw: string;
    schema: z.ZodSchema<T>;
    errorMessage: string;
  }) {
    const raw = await this.requestText({
      system:
        "You repair malformed JSON. Return a single valid JSON object only. Keep the original meaning, do not invent unsupported facts, and prefer empty arrays or explicit uncertainty over guessing.",
      user: `The previous response was supposed to match this JSON shape:
${analysisSchemaExample}

It failed with this error:
${input.errorMessage}

Repair the previous response into a single valid JSON object only:
${input.raw}`,
      maxTokens: 2200,
      temperature: 0,
    });

    return this.parseStructuredJson({ raw, schema: input.schema });
  }

  private async requestMarkdownAnalysis(input: {
    title: string;
    type: SourceMaterialType;
    content: string;
    maxTokens?: number;
  }) {
    const markdown = await this.requestText({
      system:
        "你是一名资深交付顾问和需求分析师。请用稳定的 Markdown 结构输出分析结果，不要输出 JSON，不要输出解释，不要包裹代码块。",
      user: `请基于下面资料输出结构化分析 Markdown。
资料标题：${input.title}
资料类型：${input.type}

分析资料：
${input.content}

请严格使用下面结构：
## 分析摘要
一句话总结

## 业务背景
一段背景说明

## 业务目标
- 目标一

## 关键角色
- 角色一

## 当前痛点
- 痛点一

## 流程备注
- 备注一

## 候选需求
### 需求 1：需求标题
- 描述：需求描述
- 角色：相关角色
- 优先级：high | medium | low
- 验收标准：
  - 标准一
- 待确认：
  - 问题一

## 候选功能
### 功能 1：功能名称
- 描述：功能描述
- 角色：相关角色
- 优先级：high | medium | low
- 输入：
  - 输入一
- 输出：
  - 输出一
- 业务规则：
  - 规则一
- 待确认：
  - 问题一

## 风险
- 风险一

## 待确认问题
- 问题一

要求：
1. 所有内容使用专业中文。
2. 如果资料不足，请保留章节，但用空列表或明确的待确认问题表示。
3. 不要输出上述结构之外的任何说明。`,
      maxTokens: input.maxTokens ?? 2200,
      temperature: 0.1,
    });

    return parseMarkdownAnalysis(markdown);
  }

  async analyzeMaterial(input: {
    title: string;
    type: SourceMaterialType;
    content: string;
  }): Promise<AnalysisPayload> {
    const system = [
      "You are a senior delivery consultant and requirements analyst.",
      "Return one valid JSON object only.",
      "Do not wrap the answer in markdown.",
      "Do not invent facts that are not supported by the source material.",
      "If information is unclear, put it in openQuestions instead of guessing.",
      "All string values and arrays must use concise, professional Chinese suitable for delivery documents and customer review.",
      "Use exactly these top-level keys:",
      "summary, background, goals, painPoints, roles, processNotes, requirementCandidates, functionCandidates, risks, openQuestions.",
      "priority can only be high, medium, or low.",
      "If a field has no evidence, return an empty array rather than omitting the key.",
    ].join(" ");

    const analysisSource =
      input.content.trim().length > 3000 ? await this.summarizeForAnalysis(input) : input.content;

    const buildUserPrompt = (content: string) => `请基于下面资料做结构化需求分析，并严格返回 JSON。
资料标题：${input.title}
资料类型：${input.type}

分析资料：
${content}

返回要求：
1. summary 和 background 使用简洁、专业、适合交付评审的中文。
2. requirementCandidates 最多返回 8 条，每条包含 title、description、role、priority、acceptanceCriteria、openQuestions。
3. requirementCandidates 的 title 和 description 要写成正式需求条目，不要写成口语化句子。
4. functionCandidates 最多返回 8 条，每条包含 name、description、role、priority、inputs、outputs、businessRules、openQuestions。
5. functionCandidates 的 description 和 businessRules 要体现业务约束、交付口径或系统行为，不要只写泛泛概述。
6. priority 只能是 high、medium、low。
7. 如果资料不足，请在 risks 和 openQuestions 中明确指出。
8. 如果能识别交付边界、审批角色、验收条件或依赖前提，请优先写入对应字段。
9. 只返回 JSON，不要输出说明文字。

JSON 示例：
${analysisSchemaExample}`;

    const attempts = [
      { content: buildAnalysisSource(analysisSource, 3200), maxTokens: 2200 },
      { content: buildAnalysisSource(analysisSource, 1800), maxTokens: 1600 },
      { content: buildAnalysisSource(analysisSource, 1000), maxTokens: 1200 },
    ];
    const seen = new Set<string>();
    let lastError = "Unknown analyzeMaterial error";

    for (const attempt of attempts) {
      if (seen.has(attempt.content)) continue;
      seen.add(attempt.content);

      try {
        return await this.requestJson({
          system,
          user: buildUserPrompt(attempt.content),
          schema: analysisPayloadSchema,
          maxTokens: attempt.maxTokens,
        });
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
    }

    for (const attempt of attempts) {
      if (seen.has(`markdown:${attempt.content}`)) continue;
      seen.add(`markdown:${attempt.content}`);

      try {
        return await this.requestMarkdownAnalysis({
          title: input.title,
          type: input.type,
          content: attempt.content,
          maxTokens: attempt.maxTokens,
        });
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
    }

    const fallbackPayload = await this.fallback.analyzeMaterial(input);

    return {
      ...fallbackPayload,
      summary: `DeepSeek 分析失败，已回退为本地草稿。失败原因：${lastError}。${fallbackPayload.summary}`,
    };
  }

  async generateDocument(input: {
    documentType: GeneratedDocumentType;
    materialTitle: string;
    materialContent: string;
    analysis: AnalysisPayload;
  }): Promise<string> {
    try {
      return await this.requestText({
        system:
          "你是一名资深交付顾问。请直接输出可交付的 Markdown 文档，不要输出 JSON，不要额外解释，不要包裹代码块。",
        user: `请基于下面资料与分析结果，直接生成一份${documentTypePromptLabels[input.documentType]} Markdown 文档。

资料标题：${input.materialTitle}

原始资料：
${buildAnalysisSource(input.materialContent, 4200)}

结构化分析：
${JSON.stringify(input.analysis, null, 2)}

要求：
1. 只输出 Markdown 正文。
2. 标题、章节、列表、表格要完整可读。
3. 对资料不足的地方明确标注“待确认”或“待补充”，不要编造事实。
4. 内容必须适合客户评审和内部交付使用。
5. 文档类型必须匹配：${documentTypePromptLabels[input.documentType]}。`,
        maxTokens: 2800,
        temperature: 0.2,
      });
    } catch {
      return renderDocument(input);
    }
  }

  async chat(input: {
    question: string;
    materialTitle: string;
    materialContent: string;
    analysis?: AnalysisPayload;
    documents: Array<{ title: string; type: string; content: string }>;
    retrievedContext: Array<{ ordinal: number; text: string; keywords: string[]; score: number }>;
  }): Promise<string> {
    const analysisSummary = input.analysis
      ? JSON.stringify(
          {
            summary: input.analysis.summary,
            goals: input.analysis.goals,
            risks: input.analysis.risks,
            openQuestions: input.analysis.openQuestions,
          },
          null,
          2,
        )
      : "暂无结构化分析结果。";
    const retrievedContext = input.retrievedContext.length
      ? input.retrievedContext
          .map(
            (chunk) =>
              `片段 #${chunk.ordinal + 1} (score=${chunk.score})\n${chunk.text}\n关键词：${chunk.keywords.join("、")}`,
          )
          .join("\n\n")
      : "暂无知识片段。";
    const documents = input.documents.length
      ? input.documents
          .slice(0, 3)
          .map((document) => `${document.title}\n${document.content.slice(0, 600)}`)
          .join("\n\n---\n\n")
      : "暂无已生成文档。";

    try {
      return await this.requestText({
        system:
          "你是一名谨慎的交付顾问助手。回答必须基于提供的资料、结构化分析和知识片段；不要虚构事实；如果信息不足，明确说明缺口并建议下一步确认项。",
        user: `请基于以下上下文回答问题，使用简洁专业的中文。
资料标题：${input.materialTitle}

原始资料：
${input.materialContent}

结构化分析：
${analysisSummary}

知识片段：
${retrievedContext}

已生成文档摘要：
${documents}

用户问题：${input.question}`,
        maxTokens: 1200,
        temperature: 0.3,
      });
    } catch {
      return this.fallback.chat(input);
    }
  }
}
