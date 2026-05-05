export type ProjectStage = "RESEARCH" | "SOLUTION" | "CONFIGURATION" | "INTERNAL_TEST" | "UAT" | "LAUNCH_READY" | "LIVE";
export type SourceType = "INTERVIEW" | "MEETING" | "BUSINESS_CONTEXT" | "OTHER";
export type RequirementType = "FEATURE" | "DATA" | "WORKFLOW" | "PERMISSION" | "REPORT" | "INTEGRATION" | "NON_FUNCTIONAL";
export type Priority = "HIGH" | "MEDIUM" | "LOW";
export type RequirementStatus = "DRAFT" | "CONFIRMED" | "CHANGED" | "REJECTED";
export type TestCaseType = "FUNCTIONAL" | "WORKFLOW" | "PERMISSION" | "DATA" | "EXCEPTION" | "UAT";
export type TestCaseStatus = "NOT_RUN" | "PASSED" | "FAILED" | "BLOCKED";
export type UATStatus = "NOT_STARTED" | "IN_PROGRESS" | "PASSED" | "FAILED" | "WAITING_CUSTOMER";
export type DocumentType = "PRD" | "SOLUTION" | "TEST_PLAN" | "UAT" | "TRAINING_MANUAL" | "LAUNCH_CHECKLIST";

export function labelFor(record: Record<string, string>, value: string): string {
  return record[value] ?? value;
}

export const stageLabels: Record<ProjectStage, string> = {
  RESEARCH: "需求调研",
  SOLUTION: "方案设计",
  CONFIGURATION: "系统配置",
  INTERNAL_TEST: "内部测试",
  UAT: "UAT",
  LAUNCH_READY: "上线准备",
  LIVE: "已上线",
};

export const sourceTypeLabels: Record<SourceType, string> = {
  INTERVIEW: "客户访谈",
  MEETING: "会议纪要",
  BUSINESS_CONTEXT: "业务背景",
  OTHER: "其他",
};

export const requirementTypeLabels: Record<RequirementType, string> = {
  FEATURE: "功能需求",
  DATA: "数据需求",
  WORKFLOW: "流程需求",
  PERMISSION: "权限需求",
  REPORT: "报表需求",
  INTEGRATION: "集成需求",
  NON_FUNCTIONAL: "非功能需求",
};

export const priorityLabels: Record<Priority, string> = {
  HIGH: "高",
  MEDIUM: "中",
  LOW: "低",
};

export const requirementStatusLabels: Record<RequirementStatus, string> = {
  DRAFT: "草稿",
  CONFIRMED: "已确认",
  CHANGED: "已变更",
  REJECTED: "已拒绝",
};

export const testCaseTypeLabels: Record<TestCaseType, string> = {
  FUNCTIONAL: "功能测试",
  WORKFLOW: "流程测试",
  PERMISSION: "权限测试",
  DATA: "数据校验",
  EXCEPTION: "异常场景",
  UAT: "UAT 测试",
};

export const testCaseStatusLabels: Record<TestCaseStatus, string> = {
  NOT_RUN: "未执行",
  PASSED: "已通过",
  FAILED: "未通过",
  BLOCKED: "阻塞",
};

export const uatStatusLabels: Record<UATStatus, string> = {
  NOT_STARTED: "未开始",
  IN_PROGRESS: "进行中",
  PASSED: "已通过",
  FAILED: "未通过",
  WAITING_CUSTOMER: "待客户确认",
};

export const documentTypeLabels: Record<DocumentType, string> = {
  PRD: "PRD / 需求说明",
  SOLUTION: "功能方案",
  TEST_PLAN: "测试计划",
  UAT: "UAT 清单",
  TRAINING_MANUAL: "培训手册",
  LAUNCH_CHECKLIST: "上线检查表",
};
