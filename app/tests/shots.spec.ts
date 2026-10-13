import { test } from "@playwright/test";

/**
 * README 界面素材生成器。
 * 跑 `npm run test:browser -- tests/shots.spec.ts` 会重新生成 assets/screens/ 下的全部图片。
 * 界面改动后重跑一次即可，不要手工替换截图。
 */
const OUT = "../assets/screens";

/** 输出 1x 原始尺寸即可：README 里的显示宽度用不到 2x，仓库体积要省着点。 */
test.use({ viewport: { width: 1440, height: 940 } });

test("生成界面素材", async ({ page }) => {
  page.setDefaultTimeout(60000);

  // 1. 封面入口页
  await page.goto("/");
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/01-landing.png` });

  // 2. 主页：玩法说明 / 案例入口 / Ghost 介绍
  await page.getByRole("button", { name: "进入模拟器" }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/02-home.png` });

  // 3. 初始剧情：正在逐字打出这一局的处境
  await page.getByRole("button", { name: /案例 A/ }).click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/03-intro-typing.png` });

  // 4. 剧情读完，露出规则行
  await page.locator(".backdrop-card").click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/04-intro-done.png` });

  // 5. 策略页：三种策略里选一个
  await page.getByRole("button", { name: "继续 · 选择策略" }).click();
  await page.waitForTimeout(500);
  await page.locator(".talent-card").first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/05-strategy.png` });

  // 6. 局内：左剧情右电量，Ghost 在底栏
  await page.getByRole("button", { name: "确认选择", exact: true }).click();
  await page.waitForTimeout(700);
  await page.locator(".event-story").click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/06-event.png` });

  // 7. 选一个动作并确认（展示耗电预览与像素电池变化）
  await page.locator(".choice:not(:disabled)").first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/07-event-confirm.png` });
  await page.getByTestId("confirm-action").click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/08-event-after.png` });

  // 8. 走完这一局到结算页
  for (let i = 0; i < 14 && !(await page.getByTestId("player-score").count()); i++) {
    if (await page.locator(".event-story").count()) await page.locator(".event-story").click();
    const choice = page.locator(".choice:not(:disabled)").first();
    if (await choice.count()) await choice.click();
    const confirm = page.getByTestId("confirm-action");
    if (await confirm.count()) await confirm.click();
    await page.waitForTimeout(350);
  }
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${OUT}/09-results.png` });

  // 9. 结算后半：两层权重、逐题对照与公式
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/10-results-weights.png` });
});
