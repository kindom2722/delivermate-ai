# MetaGPT Bridge Design

## Goal

Integrate MetaGPT into DeliverMate as an agent orchestration layer while keeping DeepSeek as the underlying LLM provider. After this change, AI analysis and document generation should go through MetaGPT first, with the current DeepSeek-based provider kept as a fallback.

## Non-Goals

- Do not replace DeepSeek as the underlying model provider.
- Do not migrate chat/Q&A to MetaGPT in this first iteration.
- Do not redesign the UI or Prisma schema for agent-specific artifacts yet.

## Recommended Architecture

Runtime flow:

```text
DeliverMate API
  -> MetaGPTBridgeProvider (Node/TypeScript)
    -> Python bridge script
      -> MetaGPT
        -> DeepSeek-compatible API
```

The existing `AIProvider` interface remains the boundary used by the application. We add a new `MetaGPTBridgeProvider` that implements the same interface and delegates analysis/document work to a local Python process.

## Provider Selection

Add a new mode:

- `AI_PROVIDER=metagpt`

Selection behavior:

- `metagpt` and all required MetaGPT bridge env vars present: use `MetaGPTBridgeProvider`
- `deepseek` and DeepSeek API key present: use `DeepSeekProvider`
- otherwise: use `MockAIProvider`

The UI label should clearly distinguish:

- `MetaGPT + DeepSeek`
- `DeepSeek`
- `Mock AI`

## Node / Python Boundary

### TypeScript side

Add a new provider and bridge utility:

- `src/lib/ai/metagpt-provider.ts`
- `src/lib/ai/metagpt-bridge.ts`

Responsibilities:

- Build a request payload for `analyze` or `generate_document`
- Spawn a local Python process
- Pass JSON over stdin or a temp file
- Parse structured JSON response
- Convert bridge failures into clear application errors
- Optionally fall back to `DeepSeekProvider` when enabled

### Python side

Add a small local integration package:

- `scripts/metagpt_bridge.py`
- `scripts/metagpt_runner/` if supporting modules are needed

Responsibilities:

- Load bridge request JSON
- Initialize MetaGPT using local config
- Configure MetaGPT to call the DeepSeek-compatible endpoint using env vars
- Run the requested workflow
- Return a single JSON object to stdout

This bridge must avoid interactive behavior and always run as a one-shot command.

## MetaGPT Workflow Scope

### Phase 1

MetaGPT handles:

- structured analysis
- markdown document generation

Chat stays on the current provider path.

### Analysis output contract

The Python bridge must return data matching the existing `AnalysisPayload` shape so that current storage, API routes, and UI can remain unchanged.

### Document output contract

The Python bridge returns Markdown text directly.

## Failure Handling

Failure order:

1. Try MetaGPT bridge
2. If bridge fails and `METAGPT_ALLOW_DEEPSEEK_FALLBACK=true`, fall back to `DeepSeekProvider`
3. If DeepSeek also fails, preserve current mock fallback behavior where appropriate

Error messages should be explicit about which layer failed:

- MetaGPT bridge unavailable
- Python runtime missing
- MetaGPT execution failed
- DeepSeek fallback used

## Configuration

Add env vars such as:

- `AI_PROVIDER=metagpt`
- `METAGPT_PYTHON_PATH`
- `METAGPT_BRIDGE_SCRIPT`
- `METAGPT_ALLOW_DEEPSEEK_FALLBACK`
- `METAGPT_TIMEOUT_MS`

MetaGPT itself will still use:

- `DEEPSEEK_API_KEY`
- `DEEPSEEK_BASE_URL`
- `DEEPSEEK_MODEL`

If MetaGPT needs its own config file, generate it locally from env values rather than checking secrets into the repo.

## Testing Strategy

Add tests for:

- provider selection logic
- bridge response parsing
- fallback behavior when Python/MetaGPT fails
- analysis route using MetaGPT mode
- document generation route using MetaGPT mode

Do not require MetaGPT to be installed for unit tests. Mock the bridge process in tests.

## Implementation Steps

1. Add provider selection support for `metagpt`
2. Add TypeScript bridge utility and provider
3. Add Python bridge script with a minimal one-shot workflow
4. Wire analysis and document generation through the new provider
5. Add tests and docs

## Risks

- Local Python/MetaGPT setup may be heavy or version-sensitive on Windows
- MetaGPT startup cost may increase latency compared with direct DeepSeek calls
- A one-shot process model is simpler to integrate but slower than a resident service

## Chosen Tradeoff

Use a one-shot local Python bridge first. It is slower, but it minimizes moving parts, keeps deployment simple, and matches the current DeliverMate architecture. If latency becomes a real issue later, the bridge can evolve into a local HTTP worker without changing the `AIProvider` boundary.
