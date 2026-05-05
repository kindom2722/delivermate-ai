import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

describe("runMetaGPTBridge", () => {
  it("throws when python path is missing", async () => {
    process.env.METAGPT_PYTHON_PATH = "";
    process.env.METAGPT_BRIDGE_SCRIPT = "scripts/metagpt_bridge.py";

    const { runMetaGPTBridge } = await import("./metagpt-bridge");

    await expect(
      runMetaGPTBridge({
        operation: "analyze",
        payload: { title: "x", type: "meeting", content: "y" },
      }),
    ).rejects.toThrow("METAGPT_PYTHON_PATH is not configured.");
  });
});
