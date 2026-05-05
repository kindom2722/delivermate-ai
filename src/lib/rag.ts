const DEFAULT_CHUNK_SIZE = 320;
const DEFAULT_CHUNK_OVERLAP = 48;

const ENGLISH_STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "have",
  "will",
  "into",
  "about",
  "they",
  "them",
  "their",
  "what",
  "which",
  "when",
  "where",
  "how",
  "why",
  "are",
  "was",
  "were",
  "you",
  "your",
  "but",
  "not",
  "can",
  "has",
  "had",
]);

const CHINESE_STOP_WORDS = new Set([
  "需求",
  "功能",
  "内容",
  "信息",
  "资料",
  "文档",
  "情况",
  "问题",
  "模块",
  "方面",
  "部分",
  "内容",
  "时候",
  "东西",
  "我们",
  "你们",
  "他们",
  "这个",
  "那个",
  "这里",
  "那里",
  "目前",
  "当前",
  "已经",
  "还有",
  "通过",
  "进行",
  "需要",
  "希望",
  "支持",
  "实现",
  "提供",
  "建设",
  "打造",
  "一套",
  "一个",
  "一种",
  "相关",
  "可以",
  "能够",
  "如果",
  "因为",
  "所以",
  "然后",
  "以及",
]);

const CHINESE_PREFIXES = [
  "用户需要一套",
  "客户需要一套",
  "客户提出建设一套",
  "客户提出打造一套",
  "需要一套完善的",
  "需要一个完善的",
  "完善的",
  "项目目标是",
  "主要目标是",
  "本次项目是",
  "本项目是",
  "本项目要",
  "当前需要",
  "当前希望",
  "需要一套",
  "需要一个",
  "希望一套",
  "希望一个",
  "用于",
  "通过",
  "围绕",
  "针对",
  "面向",
  "关于",
  "对于",
  "客户",
  "用户",
];

const CHINESE_SUFFIXES = [
  "方面",
  "内容",
  "情况",
  "问题",
  "信息",
  "能力",
  "流程",
  "模块",
];

export type KnowledgeChunkInput = {
  ordinal: number;
  text: string;
  keywords: string[];
};

export function normalizeText(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
}

function sanitizeKeyword(token: string) {
  const normalized = token.trim().toLowerCase();
  if (!normalized) return "";
  if (/^[a-z0-9]{2,}$/.test(normalized)) {
    return ENGLISH_STOP_WORDS.has(normalized) ? "" : normalized;
  }

  const chineseOnly = normalized.replace(/[^\u4e00-\u9fff]/g, "");
  if (chineseOnly.length < 2) return "";
  if (CHINESE_STOP_WORDS.has(chineseOnly)) return "";
  return chineseOnly;
}

function pruneKeywords(tokens: string[], limit: number) {
  const result: string[] = [];
  for (const token of tokens) {
    const sanitized = sanitizeKeyword(token);
    if (!sanitized || result.includes(sanitized)) continue;
    if (result.some((existing) => existing.includes(sanitized) && existing.length >= sanitized.length)) continue;
    const removable = result.filter((existing) => sanitized.includes(existing) && sanitized.length > existing.length);
    for (const item of removable) {
      result.splice(result.indexOf(item), 1);
    }
    result.push(sanitized);
    if (result.length >= limit) break;
  }
  return result;
}

function cleanChinesePhrase(fragment: string) {
  let value = fragment.trim();
  if (!value) return "";

  let changed = true;
  while (changed) {
    changed = false;
    for (const prefix of CHINESE_PREFIXES) {
      if (value.startsWith(prefix) && value.length > prefix.length + 1) {
        value = value.slice(prefix.length);
        changed = true;
      }
    }
    value = value.replace(/^(的|了|在|把|将|对|与)+/, "");
    value = value.replace(/(的|了|等)+$/, "");
  }

  for (const suffix of CHINESE_SUFFIXES) {
    if (value.endsWith(suffix) && value.length > suffix.length + 1) {
      value = value.slice(0, -suffix.length);
    }
  }

  value = value.replace(/^[^\u4e00-\u9fff]+|[^\u4e00-\u9fff]+$/g, "");
  return value;
}

function extractEnglishKeywords(text: string, frequency: Map<string, number>) {
  const normalized = normalizeText(text).toLowerCase();
  const englishTokens = normalized.match(/[a-z0-9]{2,}/g) ?? [];
  for (const token of englishTokens) {
    if (ENGLISH_STOP_WORDS.has(token)) continue;
    frequency.set(token, (frequency.get(token) ?? 0) + 1);
  }
}

function extractChineseKeywords(text: string, frequency: Map<string, number>) {
  const segments = normalizeText(text).split(/[，。！？；：、,.!?;:\n\r()（）【】\[\]<>《》"“”'‘’/|]/);

  for (const segment of segments) {
    const runs = segment.match(/[\u4e00-\u9fff]{2,24}/g) ?? [];
    for (const run of runs) {
      const cleaned = cleanChinesePhrase(run);
      if (!cleaned || cleaned.length < 2) continue;

      const candidates = [cleaned];
      if (cleaned.includes("的")) {
        candidates.push(...cleaned.split("的"));
      }
      if (cleaned.includes("与")) {
        candidates.push(...cleaned.split("与"));
      }
      if (cleaned.includes("和")) {
        candidates.push(...cleaned.split("和"));
      }

      for (const candidate of candidates) {
        const normalizedCandidate = cleanChinesePhrase(candidate);
        if (!normalizedCandidate || normalizedCandidate.length < 2 || normalizedCandidate.length > 12) continue;
        if (CHINESE_STOP_WORDS.has(normalizedCandidate)) continue;
        frequency.set(normalizedCandidate, (frequency.get(normalizedCandidate) ?? 0) + 1);
      }
    }
  }
}

export function extractKeywords(text: string, limit = 8): string[] {
  const frequency = new Map<string, number>();
  extractEnglishKeywords(text, frequency);
  extractChineseKeywords(text, frequency);

  const ranked = [...frequency.entries()]
    .sort((left, right) => right[1] - left[1] || right[0].length - left[0].length || left[0].localeCompare(right[0]))
    .map(([token]) => token);

  return pruneKeywords(ranked, limit);
}

export function splitIntoKnowledgeChunks(
  text: string,
  options?: { chunkSize?: number; overlap?: number },
): KnowledgeChunkInput[] {
  const chunkSize = options?.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = options?.overlap ?? DEFAULT_CHUNK_OVERLAP;
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chunks: KnowledgeChunkInput[] = [];
  let buffer = "";

  const flush = () => {
    const candidate = buffer.trim();
    if (!candidate) return;
    chunks.push({
      ordinal: chunks.length,
      text: candidate,
      keywords: extractKeywords(candidate),
    });
    buffer = candidate.slice(Math.max(0, candidate.length - overlap));
  };

  for (const paragraph of paragraphs) {
    const next = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
    if (next.length <= chunkSize) {
      buffer = next;
      continue;
    }

    if (buffer) flush();

    if (paragraph.length <= chunkSize) {
      buffer = paragraph;
      continue;
    }

    let start = 0;
    while (start < paragraph.length) {
      const end = Math.min(start + chunkSize, paragraph.length);
      const slice = paragraph.slice(start, end).trim();
      if (slice) {
        chunks.push({
          ordinal: chunks.length,
          text: slice,
          keywords: extractKeywords(slice),
        });
      }
      if (end >= paragraph.length) break;
      start = Math.max(end - overlap, start + 1);
    }
    buffer = "";
  }

  if (buffer) flush();

  return chunks;
}

export function scoreChunk(query: string, chunk: { text: string; keywords: string[] }) {
  const queryTokens = extractKeywords(query, 12);
  if (!queryTokens.length) return 0;

  const normalizedText = normalizeText(chunk.text).toLowerCase();
  const keywordSet = new Set(pruneKeywords(chunk.keywords, 12));
  let score = 0;

  for (const token of queryTokens) {
    if (keywordSet.has(token)) score += 6 + Math.min(token.length, 4);
    const occurrences = normalizedText.split(token.toLowerCase()).length - 1;
    score += occurrences * Math.min(token.length, 4);
  }

  return score;
}

export function parseKeywords(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? pruneKeywords(parsed.filter((item): item is string => typeof item === "string"), 12)
      : [];
  } catch {
    return [];
  }
}
