"use client";

import { useMemo, useState } from "react";
import { BookOpenText, Database, FileText, Layers3, LibraryBig } from "lucide-react";
import { extractKeywords } from "@/lib/rag";
import { documentTypeLabels, materialTypeLabels } from "@/lib/document-labels";
import type { KnowledgeAssetDTO, MaterialDTO } from "@/lib/workspace-materials";
import { Badge, Panel } from "./ui";

function isSubmissionAsset(asset: KnowledgeAssetDTO) {
  return asset.category.startsWith("submission:");
}

function collectAssetKeywords(asset: KnowledgeAssetDTO) {
  const merged = [
    ...asset.chunks.flatMap((chunk) => chunk.keywords),
    ...extractKeywords(asset.content, 10),
  ];

  const unique: string[] = [];
  for (const keyword of merged) {
    if (!keyword || unique.includes(keyword)) continue;
    if (unique.some((existing) => existing.includes(keyword) && existing.length >= keyword.length)) continue;
    unique.push(keyword);
    if (unique.length >= 6) break;
  }
  return unique;
}

export function KnowledgeBaseClient({ initialMaterials }: { initialMaterials: MaterialDTO[] }) {
  const [selectedId, setSelectedId] = useState(initialMaterials[0]?.id ?? "");

  const selected = useMemo(
    () => initialMaterials.find((material) => material.id === selectedId) ?? initialMaterials[0],
    [initialMaterials, selectedId],
  );

  const submissionAssets = useMemo(() => selected?.knowledgeAssets.filter(isSubmissionAsset) ?? [], [selected]);
  const generatedAssets = useMemo(
    () => selected?.knowledgeAssets.filter((asset) => asset.category === "generated_document") ?? [],
    [selected],
  );

  const totalAssets = initialMaterials.reduce((sum, material) => sum + material.knowledgeAssets.length, 0);
  const totalChunks = initialMaterials.reduce((sum, material) => sum + material.chunks.length, 0);
  const totalSubmissionAssets = initialMaterials.reduce(
    (sum, material) => sum + material.knowledgeAssets.filter(isSubmissionAsset).length,
    0,
  );
  const totalGeneratedAssets = initialMaterials.reduce(
    (sum, material) =>
      sum + material.knowledgeAssets.filter((asset) => asset.category === "generated_document").length,
    0,
  );

  return (
    <div className="space-y-6">
      <section className="workbench-frame hero-grid float-in overflow-hidden px-6 py-8 md:px-8">
        <div className="relative z-[1] space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge tone="teal">{initialMaterials.length} 份资料</Badge>
            <Badge tone="amber">{totalAssets} 个资产</Badge>
            <Badge>{totalChunks} 个分块</Badge>
          </div>
          <div className="max-w-3xl">
            <p className="text-sm font-semibold tracking-[0.24em] text-[#1e6ee8]">KNOWLEDGE BASE</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-6xl">
              把资料沉淀成
              <br />
              可检索、可追溯的知识底座
            </h1>
            <p className="mt-4 text-sm leading-8 text-slate-600 md:text-base">
              这里集中查看每份资料在知识库中的沉淀结果，包括原始资产、AI 生成文档和切分后的知识分块，方便你判断上下文质量是否足够支撑后续问答与交付。
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard icon={LibraryBig} label="提交类资产" value={`${totalSubmissionAssets} 个`} />
            <MetricCard icon={FileText} label="生成类资产" value={`${totalGeneratedAssets} 个`} />
            <MetricCard icon={Layers3} label="知识分块" value={`${totalChunks} 个`} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Panel className="float-in space-y-6">
          <div>
            <div className="ui-label">资料索引 / Index</div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              选择一份资料后，右侧会显示对应的知识资产、切分片段和文档沉淀情况。
            </p>
          </div>

          <div className="space-y-3">
            {initialMaterials.length ? (
              initialMaterials.map((material) => {
                const active = selected?.id === material.id;
                return (
                  <button
                    key={material.id}
                    type="button"
                    onClick={() => setSelectedId(material.id)}
                    className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${
                      active
                        ? "border-blue-200 bg-blue-50/92 shadow-[0_14px_30px_rgba(30,110,232,0.12)]"
                        : "border-slate-200 bg-white/88 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">{material.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {materialTypeLabels[material.type as keyof typeof materialTypeLabels] ?? material.type}
                        </p>
                      </div>
                      <Database className={`h-4 w-4 shrink-0 ${active ? "text-blue-600" : "text-slate-300"}`} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone="teal">{material.knowledgeAssets.length} 个资产</Badge>
                      <Badge>{material.chunks.length} 个分块</Badge>
                    </div>
                  </button>
                );
              })
            ) : (
              <EmptyState text="还没有任何资料，因此知识库中也没有可查看的条目。" />
            )}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel className="float-in">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="ui-label">知识概览 / Overview</div>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                  {selected?.title ?? "请选择资料"}
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {selected
                    ? "从这里确认资料是否已经完整沉淀进知识库，包括原始资产、生成文档与可供检索的上下文分块。"
                    : "选择左侧资料后，这里会展示对应的知识库详情。"}
                </p>
              </div>
              {selected ? (
                <div className="flex flex-wrap gap-2">
                  <Badge tone="teal">{submissionAssets.length} 个提交类资产</Badge>
                  <Badge tone="amber">{generatedAssets.length} 个生成类资产</Badge>
                  <Badge>{selected.chunks.length} 个分块</Badge>
                </div>
              ) : null}
            </div>

            {selected ? (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <SummaryTile
                  label="资料类型"
                  value={materialTypeLabels[selected.type as keyof typeof materialTypeLabels] ?? selected.type}
                />
                <SummaryTile label="分析次数" value={`${selected.analyses.length} 次`} />
                <SummaryTile label="文档数量" value={`${selected.documents.length} 份`} />
              </div>
            ) : (
              <div className="mt-6">
                <EmptyState text="暂无资料详情可展示。" />
              </div>
            )}
          </Panel>

          <Panel className="float-in">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="ui-label">知识资产 / Assets</div>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  资产分为“原始提交内容”和“AI 生成文档”两类。关键词现在按短语聚合展示，避免出现大量无意义单字。
                </p>
              </div>
              {selected ? <Badge>{selected.knowledgeAssets.length} 个资产</Badge> : null}
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-950">原始提交内容</h4>
                  <Badge tone="teal">{submissionAssets.length}</Badge>
                </div>
                <div className="space-y-3">
                  {submissionAssets.length ? (
                    submissionAssets.map((asset) => <KnowledgeAssetCard key={asset.id} asset={asset} tone="teal" />)
                  ) : (
                    <EmptyState text="这份资料暂时没有原始提交类资产。" />
                  )}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-950">AI 生成文档</h4>
                  <Badge tone="amber">{generatedAssets.length}</Badge>
                </div>
                <div className="space-y-3">
                  {generatedAssets.length ? (
                    generatedAssets.map((asset) => <KnowledgeAssetCard key={asset.id} asset={asset} tone="amber" />)
                  ) : (
                    <EmptyState text="这份资料还没有由 AI 生成并沉淀进知识库的文档。" />
                  )}
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="float-in">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="ui-label">知识分块 / Chunks</div>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  这些分块会作为后续 AI 检索问答时的上下文素材，适合用来检查切分粒度与关键词质量。
                </p>
              </div>
              {selected ? <Badge tone="teal">{selected.chunks.length} 个分块</Badge> : null}
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {selected?.chunks.length ? (
                selected.chunks.map((chunk) => (
                  <div key={chunk.id} className="inset-panel p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Chunk {chunk.ordinal + 1}
                      </span>
                      <span className="text-[11px] text-slate-400">{chunk.text.length} chars</span>
                    </div>
                    <p className="mt-3 line-clamp-5 text-sm leading-6 text-slate-700">{chunk.text}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {chunk.keywords.slice(0, 6).map((keyword) => (
                        <Badge key={`${chunk.id}-${keyword}`}>{keyword}</Badge>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="这份资料还没有切分后的知识分块。" />
              )}
            </div>
          </Panel>

          <Panel className="float-in bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(239,244,251,0.94))]">
            <div className="flex items-start gap-4">
              <div className="rounded-[20px] bg-blue-100 p-3 text-blue-700">
                <BookOpenText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-950">已关联的生成文档</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  这里展示当前资料已经关联的交付文档类型，方便你确认知识库里的输出成果是否完整。
                </p>
                {selected?.documents.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selected.documents.map((document) => (
                      <Badge key={document.id} tone="amber">
                        {documentTypeLabels[document.type as keyof typeof documentTypeLabels] ?? document.type}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4">
                    <EmptyState text="这份资料还没有关联的生成文档。" />
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof LibraryBig;
  label: string;
  value: string;
}) {
  return (
    <div className="inset-panel px-4 py-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-semibold uppercase tracking-[0.16em]">{label}</p>
      </div>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="inset-panel px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function KnowledgeAssetCard({
  asset,
  tone,
}: {
  asset: KnowledgeAssetDTO;
  tone: "amber" | "teal";
}) {
  const assetKeywords = collectAssetKeywords(asset);

  return (
    <div className="inset-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">{asset.title}</p>
          <p className="mt-1 text-xs text-slate-500">
            {asset.fileName ?? asset.sourceType} · {asset.chunks.length} chunks
          </p>
        </div>
        <Badge tone={tone}>{tone === "amber" ? "generated" : "submission"}</Badge>
      </div>
      <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-700">{asset.content}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {assetKeywords.map((keyword) => (
          <Badge key={`${asset.id}-${keyword}`}>{keyword}</Badge>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-slate-200 bg-white/76 px-4 py-6 text-sm leading-6 text-slate-500">
      {text}
    </div>
  );
}
