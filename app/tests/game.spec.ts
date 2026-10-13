import { test, expect, type Page } from "@playwright/test";

async function enter(page: Page) {
  await page.getByRole('button', { name: '进入模拟器' }).click();
}
async function chooseStrategy(page: Page) {
  await page.locator(".backdrop-card").click();
  await page.getByRole("button", {name:"继续 · 选择策略"}).click();
  await page.locator('.talent-card').first().click();
  await page.getByRole('button', { name: '确认选择', exact: true }).click();
}

/** 一直点第一个买得起的选项，直到本局结束。题数 8~12，给足余量。 */
async function answerAll(page: Page, rounds = 12) {
  for (let i = 0; i < rounds; i++) {
    const alive = await page.getByTestId("player-score").count();
    if (alive) return;
    const enabled = page.locator(".choices button:not([disabled])");
    await page.locator(".event-story").click();
    await enabled.first().click();
    await page.getByTestId("confirm-action").click();
  }
}

async function startRun(page: Page, preset: "A" | "B") {
  await page.goto("/");
  await enter(page);
  const demo = page.getByRole("button", {
    name: preset === "A" ? /案例 A/ : /案例 B/,
  });
  // 若本地还留着上一局，会直接续玩，先回到开始页
  if (!(await demo.isVisible()))
    await page.getByRole("button", { name: "回到开始页" }).click();
  await demo.click();
  // 开局先看清世界，再三选一天赋
  await expect(page.getByText("这一局的世界")).toBeVisible();
  await chooseStrategy(page);
  await expect(page.locator(".event-panel")).toBeVisible();
}

test("完整一局：看清处境 → 选天赋 → 答完 → 结算 → 导出", async ({
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

  // 逐题对照：案例 A 固定 9 步，两条路都摊开
  await page.locator(".replay-panel summary").click();
  await expect(page.locator(".replay-table tbody tr")).toHaveCount(9);

  // 同一局再试：同一个种子，重新开始
  await page.getByRole("button", { name: "同一局再试" }).click();
  await expect(page.getByText("这一局的世界")).toBeVisible();
  await chooseStrategy(page);
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
  await expect(page.getByText(/第 1 步/)).toBeVisible();
  // 题干里不该再出现 E34 这类内部编号
  await expect(page.locator(".event-title")).toHaveCount(0);
});

test("数字只选中，Enter先跳字再确认，长按不能连答", async ({ page }) => {
  await startRun(page, "A");
  await page.keyboard.press("1");
  await expect(page.getByTestId("option-0")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("battery")).toContainText("1.000%");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("step-label")).toContainText("第 1 步");
  await page.keyboard.press("Enter");
  await expect(page.getByText(/第 2 步/)).toBeVisible();
  await page.keyboard.down("1");
  await page.keyboard.down("Enter");
  await page.keyboard.down("Enter");
  await page.keyboard.up("Enter");
  await page.keyboard.up("1");
  await expect(page.getByTestId("step-label")).toContainText("第 2 步");
});

test("每一题都给出标价，且明确写出做完会剩多少", async ({ page }) => {
  await startRun(page, "A");
  const costs = page.locator(".choice-cost b");
  expect(await costs.count()).toBeGreaterThanOrEqual(3);
  await expect(page.locator(".choice-cost small").first()).toContainText("做完剩");
});

test("开局先把处境讲清楚，玩家才看得懂题", async ({ page }) => {
  await page.goto("/");
  await enter(page);
  await page.getByRole("button", { name: /案例 A/ }).click();
  const card = page.locator(".backdrop-card");
  await expect(card).toBeVisible();
  const skip = page.getByRole("button", { name: /跳过这段/ });
  if (await skip.isVisible()) await skip.click();
  await expect(card).toContainText("还剩 1.000%");
  await expect(page.locator('.intro-world')).toContainText("25–35 分钟");
});

test("中途可以放弃这一局，再重开一局", async ({ page }) => {
  await startRun(page, "A");
  await page.getByTestId("abandon").click();
  await page.getByRole("button", { name: "确定放弃并重开" }).click();
  await expect(
    page.getByRole("button", { name: /开启一段人生/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("one-percent-session-v1"),
    ),
  ).toBeNull();
});

test("权重在过程中完全不显示：选项上没有档位标签", async ({ page }) => {
  await startRun(page, "A");
  // 选项上不该出现「最重要 / 较重要 / 不重要」这类档位标签
  await expect(page.locator(".tag-tier")).toHaveCount(0);
  await expect(page.locator(".choice").getByText(/^最重要$/)).toHaveCount(0);
  // 题干区也不该出现题目权重
  await expect(page.locator(".event-panel").getByText(/题目权重/)).toHaveCount(0);
  // 玩一步，侧栏「上一步的结果」里也不许泄露
  await page.locator(".choices button:not([disabled])").first().click();
  await page.locator(".event-story").click();
  await page.getByTestId("confirm-action").click();
  await expect(page.locator(".last-action .tag-tier")).toHaveCount(0);
});

test("鼠标选择不提交，情报记录不耗电，刷新恢复同一步", async ({ page }) => {
  await startRun(page, "A");
  await page.locator(".event-story").click();
  await page.getByTestId("option-0").dblclick();
  await expect(page.getByTestId("battery")).toContainText("1.000%");
  await page.getByRole("button", { name: "已知信息", exact: true }).click();
  await expect(page.getByTestId("intel-panel")).toContainText("局部可用");
  await expect(page.getByTestId("confirm-action")).toHaveCount(0);
  await page.getByRole("button", { name: "行动记录", exact: true }).click();
  await expect(page.getByTestId("log-panel")).toContainText("还没有行动记录");
  await page.getByRole("button", { name: "行动", exact: true }).click();
  await page.getByTestId("confirm-action").click();
  await expect(page.getByTestId("step-label")).toContainText("第 2 步");
  const battery = await page.getByTestId("battery").textContent();
  await page.reload();
  await enter(page);
  await page.getByRole('button', { name: /继续上次记录/ }).click();
  await expect(page.getByTestId("step-label")).toContainText("第 2 步");
  await expect(page.getByTestId("battery")).toHaveText(battery!);
  await expect(page.getByTestId("confirm-action")).toHaveCount(0);
  await page.getByRole("button", { name: "行动记录", exact: true }).click();
  await expect(page.locator(".log-list li")).toHaveCount(1);
});

test("减少动效与立即显示都保留完整剧情，关闭设置后下一段恢复逐字", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await startRun(page, "A");
  await expect(page.locator(".event-story")).not.toHaveClass(/typing/);
  await expect(page.locator(".event-story")).not.toBeEmpty();
  await page.getByRole("button", { name: "立即显示剧情" }).click();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByTestId("option-0").click();
  await page.getByTestId("confirm-action").click();
  await expect(page.locator(".event-story")).not.toHaveClass(/typing/);
  await page.reload();
  await enter(page);
  await page.getByRole('button', { name: /继续上次记录/ }).click();
  await expect(page.getByRole("button", { name: "恢复逐字剧情" })).toBeVisible();
  await page.getByRole("button", { name: "恢复逐字剧情" }).click();
  await page.locator(".event-story").click();
  await page.getByTestId("option-0").click();
  await page.getByTestId("confirm-action").click();
  await expect(page.locator(".event-story")).toHaveClass(/typing/);
});

test("结算页揭晓两层权重、给出曲线与公式，并停在顶部", async ({ page }) => {
  await startRun(page, "A");
  await answerAll(page);
  // 一进结算页就必须停在顶部：结果在最上面，不能让人停在最下面
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.getByTestId("player-score")).toContainText("%");
  await expect(page.getByTestId("ghost-score")).toContainText("%");
  await expect(page.locator(".survival-chart")).toBeVisible();
  await expect(page.locator(".chart-legend")).toContainText("事后最优");

  // 两层权重都在结算页揭晓
  await expect(page.getByText("动作档位：这个动作本身有多重")).toBeVisible();
  await expect(
    page.getByText("题目权重：这一题在整条救援链上有多关键"),
  ).toBeVisible();

  // 逐题对照里每一道都带题目权重
  await page.locator(".weight-detail summary").click();
  const rows = page.locator(".weight-detail tbody tr");
  await expect(rows.first()).toBeVisible();
  expect(await rows.count()).toBeGreaterThan(0);

  await expect(page.getByText(/存活概率与权重的完整算法/)).toBeVisible();
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
  await enter(page);
  await page.getByRole("button", { name: /案例 A/ }).click();
  await expect(page.locator(".backdrop-card")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await chooseStrategy(page);
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

test("桌面选项可滚到无遮挡处，窄屏确认紧跟选项", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await startRun(page, "A");
  await page.locator(".event-story").click();
  const choice = page.locator(".choice").last();
  await choice.scrollIntoViewIfNeeded();
  const box = (await choice.boundingBox())!;
  const dock = (await page.locator(".decision-dock").boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(dock.y);
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileDock = (await page.locator(".decision-controls").boundingBox())!;
  const ghost = (await page.locator(".ghost-card").boundingBox())!;
  expect(mobileDock.y + mobileDock.height).toBeLessThanOrEqual(ghost.y);
});

test("低高度桌面仍能读到完整选项，底栏不覆盖内容", async ({ page }) => {
  await startRun(page, "A");
  for (const width of [1024, 1280]) {
    await page.setViewportSize({ width, height: 600 });
    const choices = (await page.locator(".choices").boundingBox())!;
    const option = (await page.getByTestId("option-0").boundingBox())!;
    const dock = (await page.locator(".decision-dock").boundingBox())!;
    expect(choices.height).toBeGreaterThanOrEqual(option.height);
    expect(choices.y + choices.height).toBeLessThanOrEqual(dock.y);
    await page.keyboard.press('Escape');
    await page.getByTestId("option-0").click();
    await expect(page.getByTestId("option-0")).toHaveAttribute("aria-pressed", "true");
  }
});

test("审查回归：鼠标后数字切换，Enter确认的是新选择", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await startRun(page, "A");
  await page.getByTestId("option-0").click();
  await page.keyboard.press("2");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("step-label")).toContainText("第 2 步");
  await expect(page.locator(".last-action")).toContainText("凭记忆判断方位");
});

test("审查回归：双击跳字不执行，之后单独确认只执行一次", async ({ page }) => {
  await startRun(page, "A");
  await page.keyboard.press("1");
  await expect(page.locator(".event-story")).toHaveClass(/typing/);
  await page.getByTestId("confirm-action").dblclick();
  await expect(page.getByTestId("step-label")).toContainText("第 1 步");
  await expect(page.getByTestId("battery")).toContainText("1.000%");
  await page.getByTestId("confirm-action").click();
  await expect(page.getByTestId("step-label")).toContainText("第 2 步");
});

test("审查回归：切回逐字不抹去已经读过的正文", async ({ page }) => {
  await startRun(page, "A");
  await page.getByRole("button", { name:"立即显示剧情" }).click();
  const full = await page.locator(".event-story").innerText();
  await page.getByRole("button", { name:"恢复逐字剧情" }).click();
  expect(await page.locator(".event-story").getAttribute("class")).not.toMatch(/typing/);
  expect(await page.locator(".event-story").innerText()).toBe(full);
});

test("行动记录的余量包含自然损耗，与当时状态栏一致", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await startRun(page, "A");
  await page.getByTestId("option-0").click();
  await page.getByTestId("confirm-action").click();
  const remaining = (await page.getByTestId('battery').innerText()).split(' / ')[0].trim();
  await page.getByRole("button", { name: "行动记录", exact:true }).click();
  await expect(page.locator(".log-list")).toContainText(`行动后余量 ${remaining}`);
});
