import { test, expect, type Page } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export async function playRound(page: Page) {
  await page.getByRole("button", { name: "进入模拟器" }).click();
  await page.getByRole("button", { name: /案例 A/ }).click();
  await page.locator(".backdrop-card").click();
  await page.getByRole("button", { name: "继续 · 选择策略" }).click();
  await page.locator(".talent-card").first().click();
  await page.getByRole("button", { name: "确认选择", exact: true }).click();
  for (
    let i = 0;
    i < 12 && !(await page.getByTestId("player-score").count());
    i++
  ) {
    await page.locator(".event-story").click();
    await page.locator(".choice:not(:disabled)").first().click();
    await page.getByTestId("confirm-action").click();
  }
  await expect(page.getByTestId("player-score")).toBeVisible();
}

for (const version of ["1.0.0", "1.1.2"])
  test(`HTML ${version} 断网文件完整对局、字体、导出和重开`, async ({
    page,
    context,
  }) => {
    const errors: string[] = [],
      remote: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => {
      if (/^https?:/.test(r.url())) remote.push(r.url());
    });
    await context.setOffline(true);
    await page.goto(
      pathToFileURL(resolve(`release/1013_OnePercentBattery_v${version}.html`))
        .href,
    );
    await expect(page).toHaveTitle(new RegExp(version.replaceAll(".", "\\.")));
    await playRound(page);
    expect(
      await page.evaluate(async () => {
        await document.fonts.ready;
        return Array.from(document.fonts).filter((f) => f.status === "loaded")
          .length;
      }),
    ).toBeGreaterThanOrEqual(2);
    const result = await page.getByTestId("player-score").textContent();
    const downloading = page.waitForEvent("download");
    await page.getByRole("button", { name: "导出本局记录" }).click();
    const download = await downloading;
    await download.saveAs(
      resolve(`test-results/offline/${version}-record.json`),
    );
    expect(await download.failure()).toBeNull();
    await page.reload();
    await page.getByRole("button", { name: "进入模拟器" }).click();
    await page.getByRole("button", { name: /继续上次记录/ }).click();
    await expect(page.getByTestId("player-score")).toHaveText(result!);
    expect(errors).toEqual([]);
    expect(remote).toEqual([]);
  });
