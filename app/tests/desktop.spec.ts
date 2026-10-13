import { test, expect, _electron as electron } from "@playwright/test";
import { resolve } from "node:path";
import { mkdir, mkdtemp } from "node:fs/promises";
import { execFileSync } from "node:child_process";

for (const version of ["1.0.0", "1.1.2"])
  test(`Windows ${version} 真实程序离线游玩与重启记录`, async () => {
    // Launch a fresh extraction of the actual downloadable ZIP, not a build directory.
    await mkdir(".cache/desktop-qa", { recursive: true });
    const extracted = await mkdtemp(resolve(".cache/desktop-qa/run-"));
    const name = `1013_OnePercentBattery-Windows-x64_v${version}`;
    const quote = (value: string) => "'" + value.replaceAll("'", "''") + "'";
    execFileSync("powershell.exe", [
      "-NoProfile",
      "-Command",
      `Add-Type -AssemblyName System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::ExtractToDirectory(${quote(resolve("release", name + ".zip"))}, ${quote(extracted)})`,
    ]);
    const executablePath = resolve(extracted, name, "OnePercentBattery.exe");
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;
    let app = await electron.launch({ executablePath, env });
    try {
      let page = await app.firstWindow();
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await app.context().setOffline(true);
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
      const result = await page.getByTestId("player-score").textContent();
      await app.close();
      app = await electron.launch({ executablePath, env });
      page = await app.firstWindow();
      await page.getByRole("button", { name: "进入模拟器" }).click();
      await page.getByRole("button", { name: /继续上次记录/ }).click();
      await expect(page.getByTestId("player-score")).toHaveText(result!);
      await page.screenshot({
        path: `test-results/offline/desktop-${version}.png`,
        fullPage: true,
      });
    } finally {
      await app.close();
    }
  });
