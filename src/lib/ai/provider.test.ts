import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

describe("getAIProviderLabel", () => {
  it("reports mock when deepseek is selected without an API key", async () => {
    process.env.AI_PROVIDER = "deepseek";
    process.env.DEEPSEEK_API_KEY = "";

    const { getAIProviderLabel } = await import("./provider");

    expect(getAIProviderLabel()).toBe("Mock AI");
  });

  it("reports deepseek only when configured", async () => {
    process.env.AI_PROVIDER = "deepseek";
    process.env.DEEPSEEK_API_KEY = "secret";

    const { getAIProviderLabel } = await import("./provider");

    expect(getAIProviderLabel()).toBe("DeepSeek");
  });

  it("reports metagpt when bridge env is configured", async () => {
    process.env.AI_PROVIDER = "metagpt";
    process.env.DEEPSEEK_API_KEY = "secret";
    process.env.METAGPT_PYTHON_PATH = "python";
    process.env.METAGPT_BRIDGE_SCRIPT = "scripts/metagpt_bridge.py";

    const { getAIProviderLabel } = await import("./provider");

    expect(getAIProviderLabel()).toBe("MetaGPT + DeepSeek");
  });

  it("falls back to deepseek label when metagpt bridge env is missing", async () => {
    process.env.AI_PROVIDER = "metagpt";
    process.env.DEEPSEEK_API_KEY = "secret";
    process.env.METAGPT_PYTHON_PATH = "";
    process.env.METAGPT_BRIDGE_SCRIPT = "";

    const { getAIProviderLabel } = await import("./provider");

    expect(getAIProviderLabel()).toBe("DeepSeek");
  });
});
