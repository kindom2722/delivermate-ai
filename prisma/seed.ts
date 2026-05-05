import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.chatMessage.deleteMany();
  await prisma.generatedDocument.deleteMany();
  await prisma.analysisResult.deleteMany();
  await prisma.sourceMaterial.deleteMany();

  const material = await prisma.sourceMaterial.create({
    data: {
      title: "客户需求沟通纪要",
      type: "meeting",
      content:
        "客户希望把目前分散在表格和聊天记录中的业务需求整理成统一文档。业务部门需要明确功能范围、验收标准和后续培训材料。当前痛点是需求描述不一致、测试场景容易遗漏、客户确认时缺少清晰的 UAT 表。希望系统能根据访谈内容自动生成需求文档、功能清单、测试用例、UAT 表和培训手册，并允许顾问继续追问哪些信息还需要补充。",
      source: "manual",
    },
  });

  const analysis = await prisma.analysisResult.create({
    data: {
      sourceMaterialId: material.id,
      summary: "这份资料描述了客户希望将分散需求整理为标准交付文档，并补齐测试、UAT 和培训材料的需求。",
      background: "客户目前的需求资料分散，缺少统一的交付文档结构。",
      goals: JSON.stringify(["统一整理需求资料", "生成标准交付文档", "减少测试和验收遗漏"]),
      painPoints: JSON.stringify(["需求描述不一致", "测试场景容易遗漏", "客户确认材料不清晰"]),
      roles: JSON.stringify(["业务部门", "交付顾问", "客户确认人", "最终用户"]),
      processNotes: JSON.stringify(["资料收集", "需求整理", "测试设计", "客户验收", "培训交付"]),
      requirementCandidates: JSON.stringify([
        {
          title: "自动整理需求文档",
          description: "系统应根据原始资料生成结构化需求文档。",
          role: "交付顾问",
          priority: "high",
          acceptanceCriteria: ["文档包含背景、目标、需求范围、验收标准和待确认问题。"],
          openQuestions: ["是否需要指定固定文档模板？"],
        },
      ]),
      functionCandidates: JSON.stringify([
        {
          name: "AI 文档生成",
          description: "根据资料生成需求文档、功能清单、测试用例、UAT 表和培训手册。",
          role: "交付顾问",
          priority: "high",
          inputs: ["原始文字资料", "AI 分析结果"],
          outputs: ["Markdown 文档", "结构化表格"],
          businessRules: ["不能编造资料中不存在的信息。"],
          openQuestions: ["是否需要人工审批后再导出？"],
        },
      ]),
      risks: JSON.stringify(["原始资料过少时生成内容可能不完整"]),
      openQuestions: JSON.stringify(["客户确认人是谁？", "是否已有标准模板？"]),
    },
  });

  await prisma.generatedDocument.create({
    data: {
      sourceMaterialId: material.id,
      analysisResultId: analysis.id,
      type: "requirements_doc",
      title: "客户需求沟通纪要 - 需求文档",
      content: `# 需求文档

## 背景说明

客户希望将分散资料整理为统一交付文档。

## 业务目标

- 统一需求表达
- 明确验收标准
- 支持后续测试、UAT 和培训`,
    },
  });

  await prisma.chatMessage.createMany({
    data: [
      {
        sourceMaterialId: material.id,
        role: "user",
        content: "这份资料里还有哪些信息需要客户补充？",
      },
      {
        sourceMaterialId: material.id,
        role: "assistant",
        content: "建议补充客户确认人、是否已有标准模板、最终用户角色以及具体验收标准。",
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
