export type SourceMaterialType = "interview" | "meeting" | "business_context" | "raw_requirements" | "other";

export type RequirementCandidate = {
  title: string;
  description: string;
  role?: string;
  priority: "high" | "medium" | "low";
  acceptanceCriteria: string[];
  openQuestions: string[];
};

export type FunctionCandidate = {
  name: string;
  description: string;
  role?: string;
  priority: "high" | "medium" | "low";
  inputs: string[];
  outputs: string[];
  businessRules: string[];
  openQuestions: string[];
};

export type AnalysisPayload = {
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
};

export type GeneratedDocumentType =
  | "requirements_doc"
  | "function_list"
  | "test_cases"
  | "uat_table"
  | "training_manual";

export type AIProvider = {
  analyzeMaterial(input: {
    title: string;
    type: SourceMaterialType;
    content: string;
  }): Promise<AnalysisPayload>;
  generateDocument(input: {
    documentType: GeneratedDocumentType;
    materialTitle: string;
    materialContent: string;
    analysis: AnalysisPayload;
  }): Promise<string>;
  chat(input: {
    question: string;
    materialTitle: string;
    materialContent: string;
    analysis?: AnalysisPayload;
    documents: Array<{ title: string; type: string; content: string }>;
    retrievedContext: Array<{ ordinal: number; text: string; keywords: string[]; score: number }>;
  }): Promise<string>;
};
