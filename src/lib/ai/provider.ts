import { DeepSeekProvider } from "./deepseek-provider";
import { isMetaGPTBridgeConfigured, MetaGPTBridgeProvider } from "./metagpt-provider";
import { MockAIProvider } from "./mock-provider";
import type { AIProvider } from "./types";

function env(name: string) {
  return process.env[name]?.trim() ?? "";
}

export function isDeepSeekRequested() {
  return env("AI_PROVIDER").toLowerCase() === "deepseek";
}

export function isMetaGPTRequested() {
  return env("AI_PROVIDER").toLowerCase() === "metagpt";
}

export function isDeepSeekConfigured() {
  const hasKey = Boolean(env("DEEPSEEK_API_KEY"));
  return hasKey;
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
