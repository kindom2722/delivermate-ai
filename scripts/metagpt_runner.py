from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any

from metagpt.actions import Action
from metagpt.configs.llm_config import LLMConfig
from metagpt.llm import LLM
from metagpt.roles import Role
from metagpt.schema import Message


def _env(name: str, default: str = "") -> str:
    import os

    value = os.getenv(name, "").strip()
    return value or default


def _build_llm():
    config = LLMConfig(
        api_key=_env("DEEPSEEK_API_KEY"),
        api_type="openai",
        base_url=_env("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
        model=_env("DEEPSEEK_MODEL", "deepseek-v4-flash"),
        timeout=int(_env("METAGPT_TIMEOUT_MS", "180000")) // 1000 or 180,
        temperature=0.2,
    )
    return LLM(config)


@dataclass
class AnalysisRequest:
    title: str
    material_type: str
    content: str


class DraftAnalysisAction(Action):
    name: str = "DraftAnalysisAction"

    async def run(self, context: str) -> str:
        prompt = f"""
You are a senior delivery consultant.
Read the source material and produce a first-pass professional analysis in markdown.
The final audience is Chinese-speaking delivery teams and client reviewers.

Return only markdown with these sections:
## Analysis Summary
## Business Background
## Goals
## Pain Points
## Roles
## Process Notes
## Candidate Requirements
## Candidate Functions
## Risks
## Open Questions

Source material:
{context}
"""
        return await self._aask(prompt)


class FinalizeAnalysisAction(Action):
    name: str = "FinalizeAnalysisAction"

    async def run(self, context: str) -> str:
        prompt = f"""
You are a principal delivery reviewer.
Refine the previous draft analysis and return one valid JSON object only.
Do not wrap the answer in markdown.
Use concise professional Chinese.

Required top-level keys:
summary, background, goals, painPoints, roles, processNotes, requirementCandidates, functionCandidates, risks, openQuestions

Each requirement candidate must include:
title, description, role, priority, acceptanceCriteria, openQuestions

Each function candidate must include:
name, description, role, priority, inputs, outputs, businessRules, openQuestions

priority can only be high, medium, or low.
If evidence is insufficient, use empty arrays and openQuestions instead of guessing.

Context:
{context}
"""
        return await self._aask(prompt)


class DraftDocumentAction(Action):
    name: str = "DraftDocumentAction"

    async def run(self, context: str) -> str:
        prompt = f"""
You are a delivery document specialist.
Draft a professional markdown document using the provided source material and structured analysis.
Return markdown only.

Context:
{context}
"""
        return await self._aask(prompt)


class FinalizeDocumentAction(Action):
    name: str = "FinalizeDocumentAction"

    async def run(self, context: str) -> str:
        prompt = f"""
You are a principal reviewer for client-facing delivery documents.
Improve the draft for structure, tone, traceability, and review readiness.
Return markdown only.
Do not add explanations outside the document.

Context:
{context}
"""
        return await self._aask(prompt)


async def _run_role(role: Role, message: Message | str) -> Message | None:
    return await role.run(with_message=message)


async def _run_analysis(payload: dict[str, Any]) -> dict[str, Any]:
    llm = _build_llm()
    source = (
        f"Title: {payload.get('title', '')}\n"
        f"Type: {payload.get('type', '')}\n"
        f"Content:\n{payload.get('content', '')}"
    )

    analyst = Role(
        name="Analyst",
        profile="Requirements Analyst",
        goal="Create a strong first-pass structured analysis",
        actions=[DraftAnalysisAction()],
        llm=llm,
    )

    reviewer = Role(
        name="Reviewer",
        profile="Delivery Review Lead",
        goal="Review and finalize the structured analysis as strict JSON",
        actions=[FinalizeAnalysisAction()],
        llm=llm,
        watch=[DraftAnalysisAction],
    )

    draft = await _run_role(analyst, source)
    if not draft:
        raise RuntimeError("MetaGPT analyst did not produce an analysis draft")

    final = await _run_role(reviewer, draft)
    if not final or not final.content:
        raise RuntimeError("MetaGPT reviewer did not produce a final analysis payload")

    import json

    return json.loads(final.content)


async def _run_document(payload: dict[str, Any]) -> str:
    llm = _build_llm()
    context = (
        f"Document Type: {payload.get('documentType', '')}\n"
        f"Material Title: {payload.get('materialTitle', '')}\n"
        f"Source Material:\n{payload.get('materialContent', '')}\n\n"
        f"Structured Analysis:\n{payload.get('analysis', {})}"
    )

    writer = Role(
        name="Writer",
        profile="Delivery Document Writer",
        goal="Draft a professional markdown document",
        actions=[DraftDocumentAction()],
        llm=llm,
    )

    reviewer = Role(
        name="DocReviewer",
        profile="Delivery Document Review Lead",
        goal="Refine the markdown output into a client-ready document",
        actions=[FinalizeDocumentAction()],
        llm=llm,
        watch=[DraftDocumentAction],
    )

    draft = await _run_role(writer, context)
    if not draft:
        raise RuntimeError("MetaGPT writer did not produce a document draft")

    final = await _run_role(reviewer, draft)
    if not final or not final.content:
        raise RuntimeError("MetaGPT reviewer did not produce a final markdown document")

    return final.content


def handle_request(request: dict[str, Any]) -> dict[str, Any]:
    operation = request.get("operation")
    payload = request.get("payload", {})

    if operation == "analyze":
        result = asyncio.run(_run_analysis(payload))
        return {"ok": True, "payload": result, "meta": {"backend": "metagpt"}}

    if operation == "generate_document":
        result = asyncio.run(_run_document(payload))
        return {"ok": True, "payload": result, "meta": {"backend": "metagpt"}}

    return {"ok": False, "error": f"Unsupported operation: {operation}", "meta": {"backend": "metagpt"}}
