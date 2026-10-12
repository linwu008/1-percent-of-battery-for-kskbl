import { test, expect, type Page } from "@playwright/test";

/** 一直点第一个买得起的选项，直到本局结束。 */
async function answerAll(page: Page, rounds = 10) {
  for (let i = 0; i < rounds; i++) {
    const alive = await page.getByTestId("player-score").count();
    if (alive) return;
    const enabled = page.locator(".choices button:not([disabled])");
    await enabled.first().click();
  }
}

async function startRun(page: Page, preset: "A" | "B") {
  await page.goto("/");
  const demo = page.getByRole("button", {
    name: preset === "A" ? /案例 A/ : /案例 B/,
  });
  // 若本地还留着上一局，会直接续玩，先回到开始页
  if (!(await demo.isVisible()))
    await page.getByRole("button", { name: "回到开始页" }).click();
  await demo.click();
  // 开局先看清世界，再三选一天赋
  await expect(page.getByText("这一局的世界")).toBeVisible();
  await page.locator(".talent-card").first().click();
  await expect(page.locator(".event-panel")).toBeVisible();
}

test("完整一局：看清世界 → 选天赋 → 答完十题 → 结算 → 导出", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await startRun(page, "A");
  await page.screenshot({
    path: "test-results/event-desktop.png",
    fullPage: true,
  });

  await expect(page.getByTestId("battery")).toContainText("1.000%");
  const seedBefore = await page.locator(".seed").first().textContent();
  await answerAll(page);
  await expect(page.getByTestId("player-score")).toBeVisible();
  await expect(page.getByTestId("ghost-score")).toBeVisible();
  await expect(page.getByText("这一局的世界与两个人")).toBeVisible();
  await page.screenshot({
    path: "test-results/results-desktop.png",
    fullPage: true,
  });

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出本局记录" }).click();
  expect((await download).suggestedFilename()).toMatch(/\.json$/);

  // 逐题对照：十道题，两条路都摊开
  await expect(page.locator(".replay-table tbody tr")).toHaveCount(10);

  // 同一局再试：同一个种子，重新开始
  await page.getByRole("button", { name: "同一局再试" }).click();
  await expect(page.getByText("这一局的世界")).toBeVisible();
  await page.locator(".talent-card").first().click();
  expect(await page.locator(".seed").first().textContent()).toBe(seedBefore);
  expect(errors).toEqual([]);
});

test("打字机只是显示方式：不推进进度，也不掉电", async ({ page }) => {
  await startRun(page, "A");
  const story = page.locator(".event-story");
  const skip = page.getByRole("button", { name: /跳过这段/ });
  if (await skip.isVisible()) await skip.click();
  else await story.click();
  await expect(page.getByTestId("battery")).toContainText("1.000%");
  await expect(page.getByText(/第 1 \/ 10 题/)).toBeVisible();
});

test("键盘 1–9 可以直接选择", async ({ page }) => {
  await startRun(page, "A");
  await page.keyboard.press("1");
  await expect(page.getByText(/第 2 \/ 10 题/)).toBeVisible();
});

test("每一题都给出标价，且明确写出做完会剩多少", async ({ page }) => {
  await startRun(page, "A");
  const costs = page.locator(".choice-cost b");
  expect(await costs.count()).toBeGreaterThanOrEqual(3);
  await expect(page.locator(".choice-cost small").first()).toContainText("做完剩");
});

test("存储不可用时仍可玩完整一局", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("storage unavailable");
    };
  });
  await startRun(page, "A");
  await expect(page.getByRole("alert")).toContainText("存储不可用");
  await answerAll(page);
  await expect(page.getByTestId("player-score")).toBeVisible();
});

test("不兼容的旧记录被保留并可下载", async ({ page }) => {
  await page.goto("/");
  const old = '{"schema":999,"notes":"older session"}';
  await page.evaluate(
    (raw) => localStorage.setItem("one-percent-session-v1", raw),
    old,
  );
  await page.reload();
  await startRun(page, "A");
  await expect(page.getByRole("button", { name: "导出旧记录" })).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("one-percent-session-recovery-v1"),
    ),
  ).toBe(old);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出旧记录" }).click();
  expect((await download).suggestedFilename()).toBe(
    "1pct-recovered-record.json",
  );
});

test("窄屏下没有横向滚动", async ({ page }) => {
  await page.goto("/");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: /案例 A/ }).click();
  await expect(page.locator(".talent-card").first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.locator(".talent-card").first().click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/event-mobile.png",
    fullPage: true,
  });
});

/** 跳过打字动画后读完整题干——避免读到还没打出来的空字符串。 */
async function readStory(page: Page) {
  const story = page.locator(".event-story");
  await story.click();
  await expect(story).not.toHaveText("");
  return (await story.textContent()) ?? "";
}

test("固定案例可复现：同一种子两次开局题目一致", async ({ page }) => {
  await startRun(page, "A");
  const first = await readStory(page);
  await page.getByRole("button", { name: "回到开始页" }).click();
  await startRun(page, "A");
  const second = await readStory(page);
  expect(second).toBe(first);
});
