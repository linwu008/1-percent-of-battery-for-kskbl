import { test, expect, type Page } from "@playwright/test";
async function waitTo(page: Page, time: number) {
  for (let i = 0; i < 20; i++) {
    const current = Number(
      await page.getByTestId("game-time").getAttribute("data-time"),
    );
    if (current >= time) return;
    await page
      .getByRole("button", { name: /等待下一变化|等待本轮结束/ })
      .click();
  }
  throw new Error("等待未到达目标");
}
test("case A plays, restores, explains, and exports", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.screenshot({
    path: "test-results/start-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "案例 A · 留下余量" }).click();
  await waitTo(page, 20);
  await page.getByRole("button", { name: /合并发送/ }).click();
  await page.reload();
  await expect(page.getByTestId("game-time")).toHaveAttribute(
    "data-time",
    "35",
  );
  await waitTo(page, 60);
  await page.getByRole("button", { name: /短光信号/ }).click();
  await waitTo(page, 100);
  await page.getByRole("button", { name: /抄写并传阅/ }).click();
  await page.getByRole("button", { name: /发送回联确认/ }).click();
  await waitTo(page, 160);
  await page.getByRole("button", { name: "根据已有安排，照应同行者" }).click();
  await expect(page.getByTestId("player-score")).toHaveText("111");
  await expect(page.getByTestId("ghost-score")).toHaveText("77");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出本局记录" }).click();
  expect((await download).suggestedFilename()).toMatch(/\.json$/);
  await page.screenshot({
    path: "test-results/results-desktop.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
  await page.getByRole("button", { name: "同局再试" }).click();
  await expect(page.getByText("同局练习 · 不计入成长")).toBeVisible();
});
test("growth needs consent and affects only the next run", async ({ page }) => {
  await page.goto("/");
  for (let run = 0; run < 2; run++) {
    if (run) await page.getByRole("button", { name: "回到开始页" }).click();
    await page.getByRole("button", { name: "案例 A · 留下余量" }).click();
    await waitTo(page, 20);
    await page.getByRole("button", { name: /合并发送/ }).click();
    await waitTo(page, 60);
    await page.getByRole("button", { name: /短光信号/ }).click();
    await waitTo(page, 100);
    await page.getByRole("button", { name: /抄写并传阅/ }).click();
    await page.getByRole("button", { name: /发送回联确认/ }).click();
    await waitTo(page, 160);
    await page
      .getByRole("button", { name: "根据已有安排，照应同行者" })
      .click();
  }
  await expect(
    page.getByRole("button", { name: "允许 Ghost 成长" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("one-percent-profile-v1")!)
          .ghostVersion,
    ),
  ).toBe(1);
  await page.getByRole("button", { name: "允许 Ghost 成长" }).click();
  await expect(page.getByTestId("ghost-score")).toHaveText("77");
  await page.reload();
  await expect(page.getByTestId("ghost-score")).toHaveText("77");
  await page.getByRole("button", { name: "再开一局 ↗" }).click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("one-percent-session-v1")!)
          .ghostVersion,
    ),
  ).toBe(2);
});
test("storage unavailable still permits a playable session", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("storage unavailable");
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "案例 A · 留下余量" }).click();
  await expect(page.getByRole("alert")).toContainText("存储不可用");
  await page.getByRole("button", { name: /发送位置/ }).click();
  await expect(page.getByTestId("game-time")).toHaveAttribute(
    "data-time",
    "10",
  );
});
test("case B can lose despite having energy left", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "案例 B · 抓住窗口" }).click();
  await waitTo(page, 60);
  await page.getByRole("button", { name: /短光信号/ }).click();
  await waitTo(page, 100);
  await page.getByRole("button", { name: /抄写并传阅/ }).click();
  await page.getByRole("button", { name: /发送位置/ }).click();
  await waitTo(page, 160);
  await page.getByRole("button", { name: "先核对大家手中的信息" }).click();
  await expect(page.getByTestId("player-score")).toHaveText("28");
  await expect(page.getByTestId("ghost-score")).toHaveText("99");
  await expect(page.getByRole("heading", { name: "落后镜像" })).toBeVisible();
});
test("narrow screen, idle time and broken storage", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem("one-percent-session-v1", "broken"),
  );
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("记录不可用");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "案例 A · 留下余量" }).click();
  await page.waitForTimeout(1200);
  await expect(page.getByTestId("game-time")).toHaveAttribute("data-time", "0");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/event-mobile.png",
    fullPage: true,
  });
});
test("incompatible record is retained and downloadable after a new run", async ({
  page,
}) => {
  await page.goto("/");
  const old = '{"schema":999,"notes":"older session"}';
  await page.evaluate(
    (raw) => localStorage.setItem("one-percent-session-v1", raw),
    old,
  );
  await page.reload();
  await page.getByRole("button", { name: "案例 A · 留下余量" }).click();
  await expect(page.getByRole("button", { name: "导出旧记录" })).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("one-percent-session-recovery-v1"),
    ),
  ).toBe(old);
  await page.reload();
  await expect(page.getByRole("button", { name: "导出旧记录" })).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出旧记录" }).click();
  expect((await download).suggestedFilename()).toBe(
    "1pct-recovered-record.json",
  );
});
