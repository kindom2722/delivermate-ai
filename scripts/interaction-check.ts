import { chromium } from "@playwright/test";

async function main() {
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(error.message));

  await page.goto(process.env.CHECK_URL ?? "http://127.0.0.1:3103", {
    waitUntil: "domcontentloaded",
  });
  await page.getByRole("button", { name: /AI 分析当前资料/ }).click();
  await page.waitForTimeout(800);
  const afterAnalysisText = await page.locator("body").innerText();
  if (!afterAnalysisText.includes("功能清单")) {
    console.log(afterAnalysisText);
    throw new Error("Document generation buttons disappeared after analysis.");
  }
  await page.locator("button").filter({ hasText: "功能清单" }).first().click();
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: /这份资料有哪些核心需求/ }).click();
  await page.getByRole("button", { name: /^发送$/ }).click();
  await page.waitForTimeout(800);

  console.log(JSON.stringify({ url: page.url(), failures }, null, 2));
  await browser.close();

  if (failures.length > 0 || !page.url().endsWith("/")) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
