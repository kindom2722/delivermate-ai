import * as childProcess from "node:child_process";
import type { AnalysisPayload, GeneratedDocumentType, SourceMaterialType } from "./types";

function env(name: string) {
  return process.env[name]?.trim() ?? "";
}

export type MetaGPTBridgeRequest =
  | {
      operation: "analyze";
      payload: {
        title: string;
        type: SourceMaterialType;
        content: string;
      };
    }
  | {
      operation: "generate_document";
      payload: {
        documentType: GeneratedDocumentType;
        materialTitle: string;
        materialContent: string;
        analysis: AnalysisPayload;
      };
    };

export type MetaGPTBridgeResponse =
  | { ok: true; payload: AnalysisPayload | string; meta?: { backend?: string } }
  | { ok: false; error: string; meta?: { backend?: string } };

export async function runMetaGPTBridge(input: MetaGPTBridgeRequest): Promise<MetaGPTBridgeResponse> {
  const pythonPath = env("METAGPT_PYTHON_PATH");
  const scriptPath = env("METAGPT_BRIDGE_SCRIPT");
  const timeoutMs = Number(env("METAGPT_TIMEOUT_MS") || "180000");

  if (!pythonPath) {
    throw new Error("METAGPT_PYTHON_PATH is not configured.");
  }

  if (!scriptPath) {
    throw new Error("METAGPT_BRIDGE_SCRIPT is not configured.");
  }

  return new Promise((resolve, reject) => {
    const child = childProcess.spawn(pythonPath, [scriptPath], {
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`MetaGPT bridge timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(new Error(`Failed to start MetaGPT bridge: ${error.message}`));
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
        reject(
          new Error(
            `Invalid MetaGPT bridge response: ${error instanceof Error ? error.message : String(error)}`,
          ),
        );
      }
    });

    child.stdin.write(JSON.stringify(input));
    child.stdin.end();
  });
}
