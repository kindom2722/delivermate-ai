# MetaGPT Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local MetaGPT bridge provider so DeliverMate can route analysis and document generation through MetaGPT while keeping DeepSeek as the underlying LLM and fallback path.

**Architecture:** Keep the existing `AIProvider` boundary unchanged. Add a new `MetaGPTBridgeProvider` in TypeScript that shells out to a one-shot Python bridge script. The Python script returns normalized JSON for analysis and Markdown for document generation; if the bridge cannot run, the app can fall back to the current `DeepSeekProvider` when configured.

**Tech Stack:** Next.js App Router, TypeScript, Node child process integration, Python bridge script, MetaGPT, DeepSeek-compatible API, Vitest

---

### Task 1: Extend Provider Selection For MetaGPT

**Files:**
- Modify: `D:\CodexProjects\git\DeliverMate\src\lib\ai\provider.ts`
- Modify: `D:\CodexProjects\git\DeliverMate\src\lib\ai\provider.test.ts`
- Create: `D:\CodexProjects\git\DeliverMate\src\lib\ai\metagpt-provider.ts`

- [ ] **Step 1: Write the failing provider selection tests**

```ts
it("reports metagpt when bridge env is configured", async () => {
  process.env.AI_PROVIDER = "metagpt";
  process.env.METAGPT_PYTHON_PATH = "python";
  process.env.METAGPT_BRIDGE_SCRIPT = "scripts/metagpt_bridge.py";
  process.env.DEEPSEEK_API_KEY = "secret";

  const { getAIProviderLabel } = await import("./provider");

  expect(getAIProviderLabel()).toBe("MetaGPT + DeepSeek");
});

it("falls back to deepseek label when metagpt is requested but bridge env is missing", async () => {
  process.env.AI_PROVIDER = "metagpt";
  process.env.METAGPT_PYTHON_PATH = "";
  process.env.METAGPT_BRIDGE_SCRIPT = "";
  process.env.DEEPSEEK_API_KEY = "secret";

  const { getAIProviderLabel } = await import("./provider");

  expect(getAIProviderLabel()).toBe("DeepSeek");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/lib/ai/provider.test.ts`
Expected: FAIL because `metagpt` mode is not recognized yet.

- [ ] **Step 3: Write minimal provider-selection implementation**

```ts
import { DeepSeekProvider } from "./deepseek-provider";
import { MetaGPTBridgeProvider, isMetaGPTBridgeConfigured } from "./metagpt-provider";
import { MockAIProvider } from "./mock-provider";
import type { AIProvider } from "./types";

function env(name: string) {
  return process.env[name]?.trim() ?? "";
}

export function isDeepSeekConfigured() {
  return Boolean(env("DEEPSEEK_API_KEY"));
}

export function isMetaGPTRequested() {
  return env("AI_PROVIDER").toLowerCase() === "metagpt";
}

export function getAIProviderLabel() {
  if (isMetaGPTRequested() && isMetaGPTBridgeConfigured() && isDeepSeekConfigured()) {
    return "MetaGPT + DeepSeek";
  }

  if (isDeepSeekConfigured()) {
    return "DeepSeek";
  }

  return "Mock AI";
}

export function getAIProvider(): AIProvider {
  if (isMetaGPTRequested() && isMetaGPTBridgeConfigured() && isDeepSeekConfigured()) {
    return new MetaGPTBridgeProvider();
  }

  if (isDeepSeekConfigured()) {
    return new DeepSeekProvider();
  }

  return new MockAIProvider();
}
```

- [ ] **Step 4: Add the temporary MetaGPT provider stub**

```ts
import { DeepSeekProvider } from "./deepseek-provider";
import type { AIProvider } from "./types";

function env(name: string) {
  return process.env[name]?.trim() ?? "";
}

export function isMetaGPTBridgeConfigured() {
  return Boolean(env("METAGPT_PYTHON_PATH") && env("METAGPT_BRIDGE_SCRIPT"));
}

export class MetaGPTBridgeProvider implements AIProvider {
  private readonly fallback = new DeepSeekProvider();

  async analyzeMaterial(input: Parameters<AIProvider["analyzeMaterial"]>[0]) {
    return this.fallback.analyzeMaterial(input);
  }

  async generateDocument(input: Parameters<AIProvider["generateDocument"]>[0]) {
    return this.fallback.generateDocument(input);
  }

  async chat(input: Parameters<AIProvider["chat"]>[0]) {
    return this.fallback.chat(input);
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- --run src/lib/ai/provider.test.ts`
Expected: PASS with new MetaGPT selection coverage.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ai/provider.ts src/lib/ai/provider.test.ts src/lib/ai/metagpt-provider.ts
git commit -m "feat: add metagpt provider selection"
```

### Task 2: Add Node-Side MetaGPT Bridge Runner

**Files:**
- Create: `D:\CodexProjects\git\DeliverMate\src\lib\ai\metagpt-bridge.ts`
- Modify: `D:\CodexProjects\git\DeliverMate\src\lib\ai\metagpt-provider.ts`
- Create: `D:\CodexProjects\git\DeliverMate\src\lib\ai\metagpt-bridge.test.ts`

- [ ] **Step 1: Write the failing bridge unit tests**

```ts
import { describe, expect, it, vi } from "vitest";

describe("runMetaGPTBridge", () => {
  it("parses analysis json from the python bridge", async () => {
    vi.mock("node:child_process", () => ({
      spawn: () => ({
        stdout: { on: (_: string, cb: (chunk: Buffer) => void) => cb(Buffer.from('{"ok":true,"payload":{"summary":"x","background":"y","goals":[],"painPoints":[],"roles":[],"processNotes":[],"requirementCandidates":[],"functionCandidates":[],"risks":[],"openQuestions":[]}}')) },
        stderr: { on: () => undefined },
        on: (event: string, cb: (code: number) => void) => event === "close" && cb(0),
        stdin: { write: () => undefined, end: () => undefined },
      }),
    }));

    const { runMetaGPTBridge } = await import("./metagpt-bridge");

    const result = await runMetaGPTBridge({
      operation: "analyze",
      payload: { title: "x", type: "meeting", content: "y" },
    });

    expect(result.ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/lib/ai/metagpt-bridge.test.ts`
Expected: FAIL because `runMetaGPTBridge` does not exist yet.

- [ ] **Step 3: Write the bridge runner**

```ts
import { spawn } from "node:child_process";

type MetaGPTBridgeRequest =
  | { operation: "analyze"; payload: { title: string; type: string; content: string } }
  | {
      operation: "generate_document";
      payload: {
        documentType: string;
        materialTitle: string;
        materialContent: string;
        analysis: unknown;
      };
    };

type MetaGPTBridgeResponse =
  | { ok: true; payload: unknown; meta?: { backend?: string } }
  | { ok: false; error: string };

function env(name: string) {
  return process.env[name]?.trim() ?? "";
}

export async function runMetaGPTBridge(input: MetaGPTBridgeRequest): Promise<MetaGPTBridgeResponse> {
  const pythonPath = env("METAGPT_PYTHON_PATH");
  const scriptPath = env("METAGPT_BRIDGE_SCRIPT");
  const timeoutMs = Number(env("METAGPT_TIMEOUT_MS") || "180000");

  return new Promise((resolve, reject) => {
    const child = spawn(pythonPath, [scriptPath], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`MetaGPT bridge timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(stderr.trim() || `MetaGPT bridge exited with code ${code}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout) as MetaGPTBridgeResponse);
      } catch (error) {
        reject(new Error(`Invalid MetaGPT bridge response: ${String(error)}`));
      }
    });

    child.stdin.write(JSON.stringify(input));
    child.stdin.end();
  });
}
```

- [ ] **Step 4: Wire the provider to use the bridge**

```ts
import { analysisPayloadSchema } from "./schemas";
import { runMetaGPTBridge } from "./metagpt-bridge";
import { DeepSeekProvider } from "./deepseek-provider";
import type { AIProvider } from "./types";

export class MetaGPTBridgeProvider implements AIProvider {
  private readonly fallback = new DeepSeekProvider();

  async analyzeMaterial(input: Parameters<AIProvider["analyzeMaterial"]>[0]) {
    const response = await runMetaGPTBridge({
      operation: "analyze",
      payload: input,
    });

    if (!response.ok) throw new Error(response.error);
    return analysisPayloadSchema.parse(response.payload);
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- --run src/lib/ai/metagpt-bridge.test.ts`
Expected: PASS with parsed bridge response.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ai/metagpt-bridge.ts src/lib/ai/metagpt-provider.ts src/lib/ai/metagpt-bridge.test.ts
git commit -m "feat: add metagpt bridge runner"
```

### Task 3: Add Python Bridge Script With Mockable Fallback Structure

**Files:**
- Create: `D:\CodexProjects\git\DeliverMate\scripts\metagpt_bridge.py`
- Create: `D:\CodexProjects\git\DeliverMate\scripts\metagpt_bridge_mock.py`
- Modify: `D:\CodexProjects\git\DeliverMate\.env.example`
- Modify: `D:\CodexProjects\git\DeliverMate\README.md`

- [ ] **Step 1: Add the bridge script contract**

```python
import json
import os
import sys

def read_request():
    raw = sys.stdin.read()
    if not raw.strip():
        raise RuntimeError("Empty MetaGPT bridge request")
    return json.loads(raw)

def write_response(payload):
    sys.stdout.write(json.dumps(payload, ensure_ascii=False))
    sys.stdout.flush()

def main():
    request = read_request()
    backend = os.getenv("METAGPT_BACKEND", "mock")

    if backend == "mock":
        from metagpt_bridge_mock import handle_request
        write_response(handle_request(request))
        return

    raise RuntimeError("MetaGPT backend is not installed yet. Set METAGPT_BACKEND=mock or install MetaGPT.")

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        sys.stderr.write(str(exc))
        sys.exit(1)
```

- [ ] **Step 2: Add a deterministic mock backend for local development**

```python
def handle_request(request):
    operation = request["operation"]

    if operation == "analyze":
        payload = request["payload"]
        return {
            "ok": True,
            "payload": {
                "summary": f"MetaGPT mock已基于《{payload['title']}》完成专业分析。",
                "background": payload["content"][:200] or "待补充背景",
                "goals": ["统一需求口径"],
                "painPoints": ["资料分散"],
                "roles": ["交付顾问"],
                "processNotes": ["MetaGPT mock分析"],
                "requirementCandidates": [],
                "functionCandidates": [],
                "risks": ["当前为MetaGPT mock结果，需接入真实MetaGPT后复核"],
                "openQuestions": ["真实MetaGPT尚未接通，当前结果为桥接验证输出"],
            },
            "meta": {"backend": "mock"},
        }

    if operation == "generate_document":
        payload = request["payload"]
        return {
            "ok": True,
            "payload": f"# {payload['materialTitle']}\\n\\n> MetaGPT mock document for {payload['documentType']}\\n",
            "meta": {"backend": "mock"},
        }

    return {"ok": False, "error": f"Unsupported operation: {operation}"}
```

- [ ] **Step 3: Document env setup**

```env
AI_PROVIDER="metagpt"
METAGPT_PYTHON_PATH="python"
METAGPT_BRIDGE_SCRIPT="scripts/metagpt_bridge.py"
METAGPT_TIMEOUT_MS="180000"
METAGPT_ALLOW_DEEPSEEK_FALLBACK="true"
METAGPT_BACKEND="mock"
```

- [ ] **Step 4: Update README with bridge behavior**

```md
- `AI_PROVIDER=metagpt` enables the local MetaGPT bridge.
- MetaGPT is treated as an agent layer, not a model vendor.
- DeepSeek remains the underlying LLM endpoint.
- `METAGPT_BACKEND=mock` verifies the bridge before installing real MetaGPT.
```

- [ ] **Step 5: Run a manual bridge smoke test**

Run:

```powershell
@'
{"operation":"analyze","payload":{"title":"测试资料","type":"meeting","content":"用户希望整理需求文档"}} 
'@ | python scripts/metagpt_bridge.py
```

Expected: JSON response with `"ok": true`.

- [ ] **Step 6: Commit**

```bash
git add scripts/metagpt_bridge.py scripts/metagpt_bridge_mock.py .env.example README.md
git commit -m "feat: add metagpt python bridge scaffold"
```

### Task 4: Route Analysis And Document Generation Through MetaGPT

**Files:**
- Modify: `D:\CodexProjects\git\DeliverMate\src\lib\ai\metagpt-provider.ts`
- Modify: `D:\CodexProjects\git\DeliverMate\src\app\api\ai\generate-document\route.ts`
- Create: `D:\CodexProjects\git\DeliverMate\src\lib\ai\metagpt-provider.test.ts`

- [ ] **Step 1: Write the failing provider integration tests**

```ts
it("returns markdown from the bridge for document generation", async () => {
  const { MetaGPTBridgeProvider } = await import("./metagpt-provider");
  const provider = new MetaGPTBridgeProvider();
  vi.spyOn(await import("./metagpt-bridge"), "runMetaGPTBridge").mockResolvedValue({
    ok: true,
    payload: "# 文档\\n\\nMetaGPT output",
  });

  const result = await provider.generateDocument({
    documentType: "requirements_doc",
    materialTitle: "资料",
    materialContent: "内容",
    analysis: {
      summary: "x",
      background: "y",
      goals: [],
      painPoints: [],
      roles: [],
      processNotes: [],
      requirementCandidates: [],
      functionCandidates: [],
      risks: [],
      openQuestions: [],
    },
  });

  expect(result).toContain("MetaGPT output");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/lib/ai/metagpt-provider.test.ts`
Expected: FAIL because document generation still uses the fallback provider.

- [ ] **Step 3: Implement bridge-backed analysis/document generation with fallback**

```ts
import { analysisPayloadSchema } from "./schemas";
import { runMetaGPTBridge } from "./metagpt-bridge";
import { DeepSeekProvider } from "./deepseek-provider";
import type { AIProvider } from "./types";

function allowFallback() {
  return (process.env.METAGPT_ALLOW_DEEPSEEK_FALLBACK ?? "true").toLowerCase() !== "false";
}

export class MetaGPTBridgeProvider implements AIProvider {
  private readonly fallback = new DeepSeekProvider();

  async analyzeMaterial(input: Parameters<AIProvider["analyzeMaterial"]>[0]) {
    try {
      const response = await runMetaGPTBridge({ operation: "analyze", payload: input });
      if (!response.ok) throw new Error(response.error);
      return analysisPayloadSchema.parse(response.payload);
    } catch (error) {
      if (!allowFallback()) throw error;
      return this.fallback.analyzeMaterial(input);
    }
  }

  async generateDocument(input: Parameters<AIProvider["generateDocument"]>[0]) {
    try {
      const response = await runMetaGPTBridge({
        operation: "generate_document",
        payload: input,
      });
      if (!response.ok) throw new Error(response.error);
      if (typeof response.payload !== "string") throw new Error("MetaGPT document response must be markdown text");
      return response.payload;
    } catch (error) {
      if (!allowFallback()) throw error;
      return this.fallback.generateDocument(input);
    }
  }

  async chat(input: Parameters<AIProvider["chat"]>[0]) {
    return this.fallback.chat(input);
  }
}
```

- [ ] **Step 4: Keep generate-document route compatible with refreshed analyses**

```ts
const provider = getAIProvider();

if (!analysis || shouldRefreshAnalysis(analysis.summary)) {
  const payload = await provider.analyzeMaterial({
    title: material.title,
    type: material.type as never,
    content: material.content,
  });
  analysis = await prisma.analysisResult.create({
    data: { sourceMaterialId: material.id, ...payloadToAnalysisData(payload) },
  });
}

const content = await provider.generateDocument({
  documentType,
  materialTitle: material.title,
  materialContent: material.content,
  analysis: analysisToPayload(analysis),
});
```

- [ ] **Step 5: Run focused tests**

Run: `npm test -- --run src/lib/ai/metagpt-provider.test.ts`
Expected: PASS with bridge-backed document generation and fallback coverage.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ai/metagpt-provider.ts src/lib/ai/metagpt-provider.test.ts src/app/api/ai/generate-document/route.ts
git commit -m "feat: route analysis and docs through metagpt bridge"
```

### Task 5: Add Real MetaGPT Backend Hook Points And Final Verification

**Files:**
- Modify: `D:\CodexProjects\git\DeliverMate\scripts\metagpt_bridge.py`
- Modify: `D:\CodexProjects\git\DeliverMate\README.md`
- Modify: `D:\CodexProjects\git\DeliverMate\SESSION_BOOTSTRAP_2026-05-04.md`

- [ ] **Step 1: Add explicit real-backend placeholder path**

```python
if backend == "metagpt":
    try:
        from metagpt_runner import handle_request
    except Exception as exc:
        raise RuntimeError(f"Failed to import MetaGPT runtime: {exc}") from exc
    write_response(handle_request(request))
    return
```

- [ ] **Step 2: Document installation and switching instructions**

```md
1. Install Python 3.9-3.11 and ensure the configured path exists.
2. Install MetaGPT in a separate virtual environment.
3. Point `METAGPT_PYTHON_PATH` at that interpreter.
4. Set `METAGPT_BACKEND=metagpt` to enable the real backend.
5. Keep `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, and `DEEPSEEK_MODEL` configured because MetaGPT still uses DeepSeek underneath.
```

- [ ] **Step 3: Update session bootstrap with current MetaGPT status**

```md
- MetaGPT bridge scaffold added
- Current default backend is `mock`
- Real MetaGPT backend requires Python + MetaGPT installation
- App can fall back to DeepSeek when bridge execution fails
```

- [ ] **Step 4: Run full verification**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all commands pass.

- [ ] **Step 5: Manual end-to-end smoke test**

Run:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3100
```

Expected:
- UI shows `MetaGPT + DeepSeek` when `AI_PROVIDER=metagpt`
- Analyze action succeeds
- Generate document succeeds

- [ ] **Step 6: Commit**

```bash
git add scripts/metagpt_bridge.py README.md SESSION_BOOTSTRAP_2026-05-04.md
git commit -m "docs: document metagpt bridge setup"
```

## Self-Review

- Spec coverage: provider selection, Node/Python boundary, MetaGPT scope, fallback, configuration, and testing are all mapped to tasks.
- Placeholder scan: no `TODO`/`TBD` placeholders remain in the executable steps; the only explicit placeholder is the intentional `metagpt` backend import hook documented as future activation.
- Type consistency: all bridge-backed analysis paths still return `AnalysisPayload`, document generation still returns Markdown text, and `AIProvider` remains the app boundary.
