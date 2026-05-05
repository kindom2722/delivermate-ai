import { DeepSeekProvider } from "./deepseek-provider";
import { runMetaGPTBridge } from "./metagpt-bridge";
import { analysisPayloadSchema } from "./schemas";
import type { AIProvider } from "./types";

function env(name: string) {
  return process.env[name]?.trim() ?? "";
}

function allowDeepSeekFallback() {
  return env("METAGPT_ALLOW_DEEPSEEK_FALLBACK").toLowerCase() !== "false";
}

export function isMetaGPTBridgeConfigured() {
  return Boolean(env("METAGPT_PYTHON_PATH") && env("METAGPT_BRIDGE_SCRIPT"));
}

export class MetaGPTBridgeProvider implements AIProvider {
  private readonly fallback = new DeepSeekProvider();

  async analyzeMaterial(input: Parameters<AIProvider["analyzeMaterial"]>[0]) {
    try {
      const response = await runMetaGPTBridge({
        operation: "analyze",
        payload: input,
      });

      if (!response.ok) {
        throw new Error(response.error);
      }

      return analysisPayloadSchema.parse(response.payload);
    } catch (error) {
      if (!allowDeepSeekFallback()) {
        throw error;
      }

      return this.fallback.analyzeMaterial(input);
    }
  }

  async generateDocument(input: Parameters<AIProvider["generateDocument"]>[0]) {
    try {
      const response = await runMetaGPTBridge({
        operation: "generate_document",
        payload: input,
      });

      if (!response.ok) {
        throw new Error(response.error);
      }

      if (typeof response.payload !== "string") {
        throw new Error("MetaGPT document response must be markdown text.");
      }

      return response.payload;
    } catch (error) {
      if (!allowDeepSeekFallback()) {
        throw error;
      }

      return this.fallback.generateDocument(input);
    }
  }

  async chat(input: Parameters<AIProvider["chat"]>[0]) {
    return this.fallback.chat(input);
  }
}
