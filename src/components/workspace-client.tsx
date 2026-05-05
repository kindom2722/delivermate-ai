"use client";

import { type PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  FileUp,
  GripVertical,
  Loader2,
  MessageSquareText,
  Minus,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { GeneratedDocumentType } from "@/lib/ai/types";
import { documentTypeLabels, documentTypeOrder, materialTypeLabels } from "@/lib/document-labels";
import type { MaterialDTO } from "@/lib/workspace-materials";
import { Badge, buttonClass, inputClass, secondaryButtonClass } from "./ui";

type DraftMaterial = Pick<MaterialDTO, "title" | "type" | "content">;
type UploadMode = "selected" | "new";
type AssistantPosition = { x: number; y: number };

const assistantWidth = 420;
const assistantHeight = 580;
const assistantGap = 20;
const assistantInitialPosition = { x: assistantGap, y: assistantGap };
const previewCollapsedHeight = 320;
const quickQuestions = [
  "这份资料最核心的业务目标是什么？",
  "目前还缺哪些关键信息需要客户补充？",
  "请帮我整理一段适合汇报的摘要。",
];

function emptyMaterial(): DraftMaterial {
  return {
    title: "新的客户资料",
    type: "meeting",
    content: "",
  };
}

function fileTitle(name: string) {
  return name.replace(/\.[^.]+$/, "");
}

function clampPosition(position: AssistantPosition, width: number, height: number): AssistantPosition {
  if (typeof window === "undefined") return position;

  const maxX = Math.max(12, window.innerWidth - width - assistantGap);
  const maxY = Math.max(12, window.innerHeight - height - assistantGap);

  return {
    x: Math.min(Math.max(12, position.x), maxX),
    y: Math.min(Math.max(12, position.y), maxY),
  };
}

function defaultAssistantPosition() {
  if (typeof window === "undefined") return assistantInitialPosition;

  const width = Math.min(assistantWidth, window.innerWidth - 24);
  const height = Math.min(assistantHeight, window.innerHeight - 24);

  return clampPosition(
    {
      x: window.innerWidth - width - assistantGap,
      y: window.innerHeight - height - assistantGap,
    },
    width,
    height,
  );
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `请求失败：${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export function WorkspaceClient({
  initialMaterials,
  aiProviderLabel,
}: {
  initialMaterials: MaterialDTO[];
  aiProviderLabel: string;
}) {
  const [materials, setMaterials] = useState(initialMaterials);
  const [selectedId, setSelectedId] = useState(initialMaterials[0]?.id ?? "");
  const [draft, setDraft] = useState<DraftMaterial>(emptyMaterial());
  const [question, setQuestion] = useState("");
  const [selectedDocId, setSelectedDocId] = useState(initialMaterials[0]?.documents[0]?.id ?? "");
  const [docDraft, setDocDraft] = useState("");
  const [uploadMode, setUploadMode] = useState<UploadMode>(initialMaterials[0] ? "selected" : "new");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploadDragOver, setIsUploadDragOver] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [assistantPosition, setAssistantPosition] = useState<AssistantPosition>(assistantInitialPosition);
  const [isDraggingAssistant, setIsDraggingAssistant] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const assistantRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const selected = useMemo(
    () => materials.find((material) => material.id === selectedId) ?? materials[0],
    [materials, selectedId],
  );
  const analysis = selected?.analyses[0];
  const selectedDocument =
    selected?.documents.find((document) => document.id === selectedDocId) ?? selected?.documents[0];
  const currentDocContent = docDraft || selectedDocument?.content || "";
  const totalDocuments = materials.reduce((sum, item) => sum + item.documents.length, 0);
  const totalKnowledgeAssets = materials.reduce((sum, item) => sum + item.knowledgeAssets.length, 0);
  const shouldCollapsePreview = (selected?.content.length ?? 0) > 600;

  useEffect(() => {
    const handleResize = () => {
      const width = assistantRef.current?.offsetWidth ?? Math.min(assistantWidth, window.innerWidth - 24);
      const height = assistantRef.current?.offsetHeight ?? Math.min(assistantHeight, window.innerHeight - 24);
      setAssistantPosition((current) => {
        const isAtInitialPosition =
          current.x === assistantInitialPosition.x && current.y === assistantInitialPosition.y;
        if (isAtInitialPosition) {
          return defaultAssistantPosition();
        }

        return clampPosition(current, width, height);
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isDraggingAssistant) return;

    const handlePointerMove = (event: PointerEvent) => {
      const width = assistantRef.current?.offsetWidth ?? Math.min(assistantWidth, window.innerWidth - 24);
      const height = assistantRef.current?.offsetHeight ?? Math.min(assistantHeight, window.innerHeight - 24);
      setAssistantPosition(
        clampPosition(
          {
            x: event.clientX - dragOffsetRef.current.x,
            y: event.clientY - dragOffsetRef.current.y,
          },
          width,
          height,
        ),
      );
    };

    const handlePointerUp = () => setIsDraggingAssistant(false);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDraggingAssistant]);

  async function runAction(actionName: string, action: () => Promise<void>) {
    setLoadingAction(actionName);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "操作失败，请稍后再试。");
    } finally {
      setLoadingAction(null);
    }
  }

  async function refresh(selectId = selected?.id) {
    const response = await fetch("/api/source-materials", { cache: "no-store" });
    const data = await readJson<{ materials: MaterialDTO[] }>(response);
    setMaterials(data.materials);

    const nextSelectedId =
      selectId && data.materials.some((item) => item.id === selectId) ? selectId : data.materials[0]?.id ?? "";
    setSelectedId(nextSelectedId);

    const nextMaterial = data.materials.find((item) => item.id === nextSelectedId) ?? data.materials[0];
    setSelectedDocId((current) => {
      if (current && nextMaterial?.documents.some((document) => document.id === current)) {
        return current;
      }
      return nextMaterial?.documents[0]?.id ?? "";
    });

    return data.materials;
  }

  function selectMaterial(material: MaterialDTO) {
    setSelectedId(material.id);
    setSelectedDocId(material.documents[0]?.id ?? "");
    setDocDraft("");
    setPreviewExpanded(false);
    setNotice(null);
    setError(null);
  }

  function createMaterial() {
    void runAction("material", async () => {
      if (draft.content.trim().length < 10) {
        throw new Error("请先输入至少 10 个字符的资料内容。");
      }

      const response = await fetch("/api/source-materials", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await readJson<{ material: MaterialDTO }>(response);
      setDraft(emptyMaterial());
      await refresh(data.material.id);
      setNotice("资料已保存。");
    });
  }

  function uploadMaterial(file: File) {
    void runAction("upload", async () => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", draft.title.trim() || fileTitle(file.name));
      formData.append("type", draft.type);

      if (uploadMode === "selected" && selected) {
        formData.append("sourceMaterialId", selected.id);
      }

      const response = await fetch("/api/source-materials", {
        method: "POST",
        body: formData,
      });
      const data = await readJson<{ material: MaterialDTO }>(response);
      await refresh(data.material.id);
      setNotice(
        uploadMode === "selected"
          ? `已将 ${file.name} 并入当前资料。`
          : `已上传并解析 ${file.name}。`,
      );
    });
  }

  function analyzeMaterial() {
    if (!selected) return;

    void runAction("analysis", async () => {
      const data = await readJson<{ providerLabel?: string }>(
        await fetch("/api/ai/analyze-material", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sourceMaterialId: selected.id }),
        }),
      );
      await refresh(selected.id);
      setNotice(`${data.providerLabel ?? aiProviderLabel} 分析已完成。`);
    });
  }

  function generateDocument(documentType: GeneratedDocumentType) {
    if (!selected) return;

    void runAction(documentType, async () => {
      const response = await fetch("/api/ai/generate-document", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sourceMaterialId: selected.id, documentType }),
      });
      const data = await readJson<{ document: { id: string; content: string } }>(response);
      setSelectedDocId(data.document.id);
      setDocDraft(data.document.content);
      await refresh(selected.id);
      setNotice(`${documentTypeLabels[documentType]}已生成。`);
    });
  }

  function saveDocument() {
    if (!selectedDocument) return;

    void runAction("save-document", async () => {
      await readJson(
        await fetch(`/api/documents/${selectedDocument.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content: docDraft || selectedDocument.content }),
        }),
      );
      await refresh(selected?.id);
      setNotice("文档修改已保存。");
    });
  }

  function deleteDocument() {
    if (!selectedDocument) return;

    void runAction("delete-document", async () => {
      await readJson(
        await fetch(`/api/documents/${selectedDocument.id}`, {
          method: "DELETE",
        }),
      );
      setDocDraft("");
      await refresh(selected?.id);
      setNotice("文档已删除。");
    });
  }

  function exportDocument() {
    if (!selectedDocument) return;
    window.open(`/api/documents/${selectedDocument.id}/export`, "_blank", "noopener,noreferrer");
  }

  function askAI() {
    if (!selected || !question.trim()) return;

    void runAction("chat", async () => {
      await readJson(
        await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sourceMaterialId: selected.id, question }),
        }),
      );
      setQuestion("");
      await refresh(selected.id);
      setNotice("AI 已回复。");
    });
  }

  function handleAssistantPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!assistantRef.current) return;

    const rect = assistantRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    setIsDraggingAssistant(true);
  }

  function openAssistant() {
    setAssistantOpen(true);
    setAssistantPosition((current) => {
      if (typeof window === "undefined") return current;
      const width = assistantRef.current?.offsetWidth ?? Math.min(assistantWidth, window.innerWidth - 24);
      const height = assistantRef.current?.offsetHeight ?? Math.min(assistantHeight, window.innerHeight - 24);
      return clampPosition(current, width, height);
    });
  }

  return (
    <>
      <div className="space-y-6 pb-32">
        <section className="workbench-frame hero-grid float-in overflow-hidden px-6 py-8 md:px-8">
          <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <div className="flex flex-wrap gap-2">
                <Badge tone="teal">当前引擎：{aiProviderLabel}</Badge>
                <Badge>{materials.length} 份资料</Badge>
                <Badge>{totalDocuments} 份文档</Badge>
                <Badge tone="amber">{totalKnowledgeAssets} 个知识资产</Badge>
              </div>
              <p className="mt-5 text-sm font-semibold tracking-[0.24em] text-[#1e6ee8]">DELIVERMATE AI WORKBENCH</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-6xl">
                让零散需求
                <br />
                变成能协作、能交付的项目文档
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
                从客户访谈、会议纪要到业务背景资料，DeliverMate 会帮你梳理重点、补齐分析脉络，并逐步生成可继续协作的需求文档、测试材料与培训内容。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[460px]">
              <MetricCard label="适配输入" value="文本 / PDF / DOCX" />
              <MetricCard label="交付结果" value="结构化文档集" />
              <MetricCard label="持续问答" value="资料 + 文档 + 知识片段" />
            </div>
          </div>
        </section>

        {(error || notice) ? (
          <div
            className={`slab-panel float-in px-5 py-4 text-sm font-medium ${
              error ? "border-red-100 bg-red-50/92 text-red-700" : "border-blue-100 bg-blue-50/92 text-blue-700"
            }`}
          >
            {error ?? notice}
          </div>
        ) : null}

        <section className="workbench-frame float-in grid overflow-hidden xl:grid-cols-[320px_minmax(0,1.08fr)_400px]">
          <div className="border-b border-slate-200/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(245,246,248,0.96))] p-6 xl:border-r xl:border-b-0">
            <div className="flex h-full flex-col gap-6">
              <div>
                <div className="ui-label">素材源库 / Material</div>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  先选择要处理的资料，再继续分析、生成和问答。左侧同时保留新建文本资料和文档上传入口。
                </p>
              </div>

              <div className="inset-panel min-h-[220px] flex-1 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-950">资料列表</p>
                  <Badge>{materials.length}</Badge>
                </div>
                <div className="max-h-[320px] space-y-3 overflow-auto pr-1">
                  {materials.length ? (
                    materials.map((material) => {
                      const active = selected?.id === material.id;
                      return (
                        <button
                          key={material.id}
                          type="button"
                          onClick={() => selectMaterial(material)}
                          className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${
                            active
                              ? "border-blue-200 bg-blue-50/92 shadow-[0_14px_30px_rgba(30,110,232,0.12)]"
                              : "border-slate-200/80 bg-white/88 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-950">{material.title}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {materialTypeLabels[material.type as keyof typeof materialTypeLabels] ?? material.type}
                              </p>
                            </div>
                            {active ? <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" /> : null}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge>{material.documents.length} 份文档</Badge>
                            <Badge tone="teal">{material.knowledgeAssets.length} 个资产</Badge>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <EmptyState text="还没有资料，先在下方录入文本或上传文件。" />
                  )}
                </div>
              </div>

              <div className="inset-panel p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-950">新建文本资料</p>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white/88 px-3 py-1.5 text-xs font-semibold text-slate-700"
                    onClick={() => setDraft(emptyMaterial())}
                  >
                    <Plus className="mr-1 inline h-3.5 w-3.5" />
                    清空
                  </button>
                </div>
                <div className="space-y-3">
                  <input
                    className={inputClass}
                    value={draft.title}
                    onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))}
                    placeholder="资料标题"
                  />
                  <select
                    className={inputClass}
                    value={draft.type}
                    onChange={(event) => setDraft((value) => ({ ...value, type: event.target.value }))}
                  >
                    {Object.entries(materialTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <textarea
                    className={`${inputClass} min-h-40 resize-y text-sm leading-7`}
                    value={draft.content}
                    onChange={(event) => setDraft((value) => ({ ...value, content: event.target.value }))}
                    placeholder="粘贴客户访谈、会议纪要、业务背景或零散需求。"
                  />
                  <button
                    type="button"
                    className={`${buttonClass} w-full`}
                    onClick={createMaterial}
                    disabled={loadingAction === "material"}
                  >
                    {loadingAction === "material" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    保存文本资料
                  </button>
                </div>
              </div>

              <div
                className={`inset-panel p-4 transition ${
                  isUploadDragOver ? "border-blue-300 bg-blue-50/88" : ""
                }`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsUploadDragOver(true);
                }}
                onDragLeave={() => setIsUploadDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsUploadDragOver(false);
                  const file = event.dataTransfer.files?.[0];
                  if (file) uploadMaterial(file);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadMaterial(file);
                    event.currentTarget.value = "";
                  }}
                />
                <div className="flex items-start gap-3">
                  <div className="rounded-[18px] bg-white p-3 text-blue-700 shadow-[0_12px_26px_rgba(30,110,232,0.12)]">
                    <FileUp className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-950">文件上传</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      支持 PDF 和 DOCX，可并入当前资料，也可单独创建为新资料。
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={uploadMode === "selected" ? buttonClass : secondaryButtonClass}
                    onClick={() => setUploadMode("selected")}
                    disabled={!selected}
                  >
                    并入当前资料
                  </button>
                  <button
                    type="button"
                    className={uploadMode === "new" ? buttonClass : secondaryButtonClass}
                    onClick={() => setUploadMode("new")}
                  >
                    创建新资料
                  </button>
                </div>

                <button
                  type="button"
                  className={`${secondaryButtonClass} mt-4 w-full`}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loadingAction === "upload"}
                >
                  {loadingAction === "upload" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  选择文件
                </button>

                <div className="data-stream mt-4">
                  STATUS: {loadingAction === "upload" ? "PARSING" : "READY"}
                  <br />
                  TARGET: {uploadMode === "selected" ? "CURRENT_MATERIAL" : "NEW_MATERIAL"}
                  <br />
                  ENCODING: UTF-8
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200/70 bg-white/82 p-6 xl:border-r xl:border-b-0">
            <div className="flex h-full flex-col gap-6">
              <div>
                <div className="ui-label">逻辑处理 / Processing</div>
                <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="teal">当前资料</Badge>
                      {selected ? <Badge>{selected.source ?? "manual"}</Badge> : null}
                    </div>
                    <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                      {selected?.title ?? "请选择一份资料开始"}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {selected
                        ? "这里会展示原始资料、AI 分析结果和当前可执行动作。先做分析，再生成交付文档，最后用 AI 助手追问和补充。"
                        : "左侧保存或上传一份资料后，这里会展开该资料的处理视图。"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={buttonClass}
                      onClick={analyzeMaterial}
                      disabled={!selected || loadingAction === "analysis"}
                    >
                      {loadingAction === "analysis" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      AI 分析资料
                    </button>
                    <button type="button" className={secondaryButtonClass} onClick={openAssistant}>
                      <MessageSquareText className="mr-2 h-4 w-4" />
                      打开 AI 助手
                    </button>
                  </div>
                </div>
              </div>

              <div className="inset-panel min-h-[260px] p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">原始资料预览</p>
                  <div className="flex items-center gap-2">
                    {selected ? (
                      <Badge>{materialTypeLabels[selected.type as keyof typeof materialTypeLabels] ?? selected.type}</Badge>
                    ) : null}
                    {shouldCollapsePreview ? (
                      <button
                        type="button"
                        className="inline-flex items-center rounded-full border border-slate-200 bg-white/88 px-3 py-1.5 text-xs font-semibold text-slate-700"
                        onClick={() => setPreviewExpanded((value) => !value)}
                      >
                        {previewExpanded ? (
                          <>
                            <ChevronUp className="mr-1 h-3.5 w-3.5" />
                            收起
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-1 h-3.5 w-3.5" />
                            展开全文
                          </>
                        )}
                      </button>
                    ) : null}
                  </div>
                </div>
                {selected ? (
                  <div className="relative">
                    <div
                      className="overflow-auto pr-2 text-sm leading-8 text-slate-700"
                      style={{
                        maxHeight: previewExpanded || !shouldCollapsePreview ? "none" : `${previewCollapsedHeight}px`,
                      }}
                    >
                      <p className="whitespace-pre-wrap">{selected.content || "暂无内容。"}</p>
                    </div>
                    {shouldCollapsePreview && !previewExpanded ? (
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(247,249,252,0.96))]" />
                    ) : null}
                  </div>
                ) : (
                  <EmptyState text="还没有可预览的资料内容。" />
                )}
              </div>

              <div className="inset-panel min-h-[340px] p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">分析概览</p>
                  {analysis ? <Badge tone="teal">已生成</Badge> : <Badge tone="amber">待分析</Badge>}
                </div>

                {analysis ? (
                  <div className="grid gap-5 lg:grid-cols-2">
                    <div className="space-y-5">
                      <InfoBlock title="分析摘要" content={analysis.summary} />
                      <InfoBlock title="业务背景" content={analysis.background} />
                      <MiniList title="业务目标" items={analysis.goals} />
                      <MiniList title="关键角色" items={analysis.roles} />
                    </div>
                    <div className="space-y-5">
                      <MiniList title="当前痛点" items={analysis.painPoints} />
                      <MiniList title="流程备注" items={analysis.processNotes} />
                      <MiniList title="风险提示" items={analysis.risks} tone="amber" />
                      <MiniList title="待确认问题" items={analysis.openQuestions} tone="amber" />
                    </div>
                  </div>
                ) : (
                  <EmptyState text="还没有分析结果。点击上方“AI 分析资料”开始生成。" />
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#f7f8fa] p-6">
            <div className="flex h-full flex-col gap-6">
              <div>
                <div className="ui-label">最终产出 / Output</div>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  右侧集中管理文档生成、编辑、导出，以及围绕当前资料的 AI 快速问答入口。
                </p>
              </div>

              <div className="inset-panel p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-950">文档生成</p>
                  <Badge tone="teal">{selected?.documents.length ?? 0} 份</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {documentTypeOrder.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={secondaryButtonClass}
                      onClick={() => generateDocument(type)}
                      disabled={!selected || loadingAction === type}
                    >
                      {loadingAction === type ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="mr-2 h-4 w-4" />
                      )}
                      {documentTypeLabels[type]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="inset-panel flex-1 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">文档编辑区</p>
                  {selectedDocument ? (
                    <Badge tone="amber">
                      {documentTypeLabels[selectedDocument.type as GeneratedDocumentType] ?? selectedDocument.type}
                    </Badge>
                  ) : (
                    <Badge>未选择文档</Badge>
                  )}
                </div>

                {selected?.documents.length ? (
                  <>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {selected.documents.map((document) => (
                        <button
                          key={document.id}
                          type="button"
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                            selectedDocument?.id === document.id
                              ? "bg-slate-950 text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)]"
                              : "border border-slate-200 bg-white/90 text-slate-700"
                          }`}
                          onClick={() => {
                            setSelectedDocId(document.id);
                            setDocDraft(document.content);
                          }}
                        >
                          {documentTypeLabels[document.type as GeneratedDocumentType] ?? document.type}
                        </button>
                      ))}
                    </div>

                    <textarea
                      className={`${inputClass} min-h-[360px] resize-y bg-white/96 font-mono text-sm leading-7`}
                      value={currentDocContent}
                      onChange={(event) => setDocDraft(event.target.value)}
                      placeholder="生成后的 Markdown 文档会显示在这里。"
                    />

                    <div className="mt-4 space-y-2">
                      <button
                        type="button"
                        className={`${buttonClass} w-full`}
                        onClick={saveDocument}
                        disabled={!selectedDocument || loadingAction === "save-document"}
                      >
                        {loadingAction === "save-document" ? "保存中..." : "保存编辑"}
                      </button>
                      <button
                        type="button"
                        className={`${secondaryButtonClass} w-full`}
                        onClick={exportDocument}
                        disabled={!selectedDocument}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        导出 Markdown
                      </button>
                      <button
                        type="button"
                        className="focus-ring inline-flex w-full items-center justify-center rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                        onClick={deleteDocument}
                        disabled={!selectedDocument || loadingAction === "delete-document"}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除文档
                      </button>
                    </div>
                  </>
                ) : (
                  <EmptyState text="还没有生成文档，先选择上方文档类型开始生成。" />
                )}
              </div>

              <div className="slab-panel subtle-pulse rounded-[24px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(239,244,251,0.94))] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold tracking-[0.14em] text-blue-700">
                      <MessageSquareText className="h-3.5 w-3.5" />
                      AI 助手
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-slate-950">围绕当前资料继续追问</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      可以基于资料、分析结果和已生成文档继续提问，也可以直接用下面的快捷问题唤起助手。
                    </p>
                  </div>
                  <button type="button" className={buttonClass} onClick={openAssistant}>
                    打开面板
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {quickQuestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="rounded-full border border-slate-200 bg-white/92 px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-white"
                      onClick={() => {
                        setQuestion(item);
                        openAssistant();
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="data-stream mt-4">
                  CHAT_LOGS: {selected?.messages.length ?? 0}
                  <br />
                  DOCUMENTS: {selected?.documents.length ?? 0}
                  <br />
                  KNOWLEDGE_CHUNKS: {selected?.chunks.length ?? 0}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {!assistantOpen ? (
        <button
          type="button"
          className="fixed bottom-6 right-6 z-40 inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_22px_48px_rgba(15,23,42,0.26)]"
          onClick={openAssistant}
        >
          <MessageSquareText className="mr-2 h-4 w-4" />
          打开 AI 助手
        </button>
      ) : null}

      <div
        ref={assistantRef}
        className={`fixed z-50 w-[min(calc(100vw-1.5rem),26rem)] overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(243,246,250,0.96))] shadow-[0_32px_90px_rgba(15,23,42,0.22)] backdrop-blur-xl transition duration-300 ${
          assistantOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
        }`}
        style={{
          left: `${assistantPosition.x}px`,
          top: `${assistantPosition.y}px`,
          maxHeight: "min(580px, calc(100vh - 24px))",
        }}
      >
        <div
          className={`flex cursor-grab items-center justify-between border-b border-slate-200/80 bg-slate-950 px-4 py-3 text-white ${
            isDraggingAssistant ? "cursor-grabbing" : ""
          }`}
          onPointerDown={handleAssistantPointerDown}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-[18px] bg-white/10 p-2">
              <Bot className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">AI 问答助手</p>
              <p className="truncate text-xs text-white/70">
                {selected ? `当前资料：${selected.title}` : "请先选择一份资料"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="mr-2 hidden items-center gap-1 text-xs text-white/60 sm:inline-flex">
              <GripVertical className="h-3.5 w-3.5" />
              拖动
            </span>
            <button
              type="button"
              className="rounded-xl p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
              onClick={() => setAssistantOpen(false)}
              aria-label="最小化 AI 问答"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-xl p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
              onClick={() => {
                setAssistantOpen(false);
                setQuestion("");
              }}
              aria-label="关闭 AI 问答"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex max-h-[calc(min(580px,100vh-24px)-58px)] flex-col">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm leading-6 text-slate-600">
              你可以围绕当前资料、分析结果和已生成文档继续追问。如果资料不足，助手会优先指出缺口。
            </p>
          </div>

          <div className="flex-1 space-y-3 overflow-auto px-4 py-4">
            {selected?.messages.length ? (
              selected.messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-[22px] p-4 text-sm leading-7 ${
                    message.role === "user" ? "ml-6 bg-blue-50 text-blue-950" : "mr-6 bg-white text-slate-700"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {message.role === "user" ? "你" : <><Bot className="h-3.5 w-3.5" /> AI</>}
                  </div>
                  {message.content}
                </div>
              ))
            ) : (
              <EmptyState text="还没有问答记录。你可以先点击下方快捷问题，或者直接输入问题。" />
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {quickQuestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="rounded-full border border-slate-200 bg-white/92 px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-white"
                  onClick={() => setQuestion(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="grid gap-3">
              <textarea
                className={`${inputClass} min-h-24`}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="基于当前资料提问..."
              />
              <button
                type="button"
                className={buttonClass}
                onClick={askAI}
                disabled={!selected || loadingAction === "chat"}
              >
                {loadingAction === "chat" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquareText className="mr-2 h-4 w-4" />
                )}
                发送问题
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="inset-panel px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function InfoBlock({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
      <p className="mt-2 text-sm leading-7 text-slate-700">{content}</p>
    </div>
  );
}

function MiniList({ title, items, tone }: { title: string; items: string[]; tone?: "amber" }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
      {items.length ? (
        <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
          {items.map((item) => (
            <li key={`${title}-${item}`} className={tone === "amber" ? "text-amber-700" : undefined}>
              - {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">暂无</p>
      )}
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
