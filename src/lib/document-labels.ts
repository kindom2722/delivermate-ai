import type { GeneratedDocumentType, SourceMaterialType } from "./ai/types";

export const materialTypeLabels: Record<SourceMaterialType, string> = {
  interview: "客户访谈",
  meeting: "会议纪要",
  business_context: "业务背景",
  raw_requirements: "零散需求",
  other: "其他资料",
};

export const documentTypeLabels: Record<GeneratedDocumentType, string> = {
  requirements_doc: "需求文档",
  function_list: "功能清单",
  test_cases: "测试用例",
  uat_table: "UAT 表",
  training_manual: "培训手册",
};

export const documentTypeOrder: GeneratedDocumentType[] = [
  "requirements_doc",
  "function_list",
  "test_cases",
  "uat_table",
  "training_manual",
];
