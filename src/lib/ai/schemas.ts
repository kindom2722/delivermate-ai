import { z } from "zod";

const prioritySchema = z.enum(["high", "medium", "low"]);

export const requirementCandidateSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  role: z.string().trim().min(1).optional(),
  priority: prioritySchema,
  acceptanceCriteria: z.array(z.string().trim().min(1)).default([]),
  openQuestions: z.array(z.string().trim().min(1)).default([]),
});

export const functionCandidateSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  role: z.string().trim().min(1).optional(),
  priority: prioritySchema,
  inputs: z.array(z.string().trim().min(1)).default([]),
  outputs: z.array(z.string().trim().min(1)).default([]),
  businessRules: z.array(z.string().trim().min(1)).default([]),
  openQuestions: z.array(z.string().trim().min(1)).default([]),
});

export const analysisPayloadSchema = z.object({
  summary: z.string().trim().min(1),
  background: z.string().trim().min(1),
  goals: z.array(z.string().trim().min(1)).default([]),
  painPoints: z.array(z.string().trim().min(1)).default([]),
  roles: z.array(z.string().trim().min(1)).default([]),
  processNotes: z.array(z.string().trim().min(1)).default([]),
  requirementCandidates: z.array(requirementCandidateSchema).default([]),
  functionCandidates: z.array(functionCandidateSchema).default([]),
  risks: z.array(z.string().trim().min(1)).default([]),
  openQuestions: z.array(z.string().trim().min(1)).default([]),
});

export type AnalysisPayloadSchema = z.infer<typeof analysisPayloadSchema>;
