import type { AnalysisResult } from "@prisma/client";
import type { AnalysisPayload } from "./ai/types";
import { parseStringArray } from "./json";

function parseJsonArray<T>(value: string, fallback: T[] = []): T[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

export function analysisToPayload(analysis: AnalysisResult): AnalysisPayload {
  return {
    summary: analysis.summary,
    background: analysis.background,
    goals: parseStringArray(analysis.goals),
    painPoints: parseStringArray(analysis.painPoints),
    roles: parseStringArray(analysis.roles),
    processNotes: parseStringArray(analysis.processNotes),
    requirementCandidates: parseJsonArray(analysis.requirementCandidates),
    functionCandidates: parseJsonArray(analysis.functionCandidates),
    risks: parseStringArray(analysis.risks),
    openQuestions: parseStringArray(analysis.openQuestions),
  };
}

export function payloadToAnalysisData(payload: AnalysisPayload) {
  return {
    summary: payload.summary,
    background: payload.background,
    goals: JSON.stringify(payload.goals),
    painPoints: JSON.stringify(payload.painPoints),
    roles: JSON.stringify(payload.roles),
    processNotes: JSON.stringify(payload.processNotes),
    requirementCandidates: JSON.stringify(payload.requirementCandidates),
    functionCandidates: JSON.stringify(payload.functionCandidates),
    risks: JSON.stringify(payload.risks),
    openQuestions: JSON.stringify(payload.openQuestions),
  };
}
