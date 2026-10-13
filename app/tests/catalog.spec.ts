import { test, expect } from "@playwright/test";

test("目录覆盖策略、搜索、无隐藏权重、主页等宽入口及返回", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "进入模拟器" }).click();
  for (const width of [1440, 800, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    const a = (await page
      .getByRole("button", { name: /开启一段人生/ })
      .boundingBox())!;
    const b = (await page
      .getByRole("button", { name: /变量目录/ })
      .boundingBox())!;
    expect(Math.abs(a.width - b.width)).toBeLessThan(1);
    expect(Math.abs(a.height - b.height)).toBeLessThan(1);
    expect(Math.abs(a.y - b.y)).toBeLessThan(1);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "test-results/v112-home.png", fullPage: true });
  await page.getByRole("button", { name: /变量目录/ }).click();
  await page.getByRole("button", { name: /行动策略/ }).click();
  await expect(page.locator(".catalog-list button")).toHaveCount(12);
  await page.getByRole("textbox", { name: "搜索当前分类" }).fill("间歇");
  await expect(page.locator(".catalog-detail h2")).toHaveText("间歇待机");
  await expect(page.locator(".catalog-detail")).toContainText("不会回电");
  await expect(page.locator(".catalog-screen")).not.toContainText("最重要 ×");
  await page.getByRole("textbox", { name: "搜索当前分类" }).fill("不存在xxx");
  await expect(page.getByText("没有找到相关条目。")).toBeVisible();
  await page.getByRole("button", { name: "清空搜索" }).click();
  await page.screenshot({
    path: "test-results/v112-catalog.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/v112-catalog-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: /返回主界面/ }).click();
  await expect(
    page.getByRole("button", { name: /开启一段人生/ }),
  ).toBeVisible();
});

test("局内不显示权重，结算可逐步核算双方概率", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "进入模拟器" }).click();
  await page.getByRole("button", { name: /案例 A/ }).click();
  await page.locator(".backdrop-card").click();
  await page.getByRole("button", { name: "继续 · 选择策略" }).click();
  await page.locator(".talent-card").first().click();
  await page.getByRole("button", { name: "确认选择", exact: true }).click();
  await expect(page.locator(".event-panel")).not.toContainText("权重");
  const raw = await page.evaluate(() =>
    localStorage.getItem("one-percent-session-v1"),
  );
  await page.getByRole("button", { name: "回到开始页" }).click();
  await page.getByRole("button", { name: /变量目录/ }).click();
  await page.getByRole("button", { name: /返回主界面/ }).click();
  expect(
    await page.evaluate(() => localStorage.getItem("one-percent-session-v1")),
  ).toBe(raw);
  await page.getByRole("button", { name: /继续上次记录/ }).click();
  for (
    let i = 0;
    i < 12 && !(await page.getByTestId("player-score").count());
    i++
  ) {
    await page.locator(".event-story").click();
    const choices = page.locator(".choice:not(:disabled)");
    if (await choices.count()) {
      await choices.first().click();
      await page.getByTestId("confirm-action").click();
    } else await page.getByRole("button", { name: /攥着手机/ }).click();
  }
  await expect(page.locator(".calculation-panel")).toBeVisible();
  await page.locator(".calculation-steps summary").click();
  await expect(page.locator(".calculation-steps")).toContainText(
    "点数 × 动作 × 题目",
  );
  for (const who of ["player", "ghost"] as const) {
    await page
      .getByRole("button", {
        name: who === "player" ? "你的计算" : "Ghost 的计算",
        exact: true,
      })
      .click();
    const expected = await page.evaluate(async (who) => {
      const session = JSON.parse(
        localStorage.getItem("one-percent-session-v1")!,
      );
      const { survivalOf } = await import("/src/game/scoring.ts");
      return (
        (survivalOf(session[who], session.world.env).p * 100).toFixed(2) + "%"
      );
    }, who);
    await expect(page.getByTestId("calculated-result").locator("b")).toHaveText(
      expected,
    );
  }
  await page
    .locator(".calculation-panel")
    .screenshot({ path: "test-results/v112-calculation.png" });
});
