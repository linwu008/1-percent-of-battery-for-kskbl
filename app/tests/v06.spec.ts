import { test, expect, type Page } from '@playwright/test';

async function lobby(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: '进入模拟器' }).click();
}
async function run(page: Page) {
  await lobby(page);
  await page.getByRole('button', { name: /案例 A/ }).click();
  await page.locator('.backdrop-card').click();
  await page.getByRole('button', {name:'继续 · 选择策略'}).click();
  await page.locator('.talent-card').first().click();
  await page.getByRole('button', { name: '确认选择', exact: true }).click();
  await page.locator('.event-story').click();
}

test('入口到主页，策略先选名称再显示效果与确认，Ghost自动选择', async ({ page }) => {
  await lobby(page);
  await expect(page.getByText('玩法说明', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /案例 A/ }).click();
  await page.locator('.backdrop-card').click();
  await page.getByRole('button', {name:'继续 · 选择策略'}).click();
  await expect(page.getByRole('heading', { name: '请选择策略' })).toBeVisible();
  await expect(page.locator('.talent-card')).toHaveCount(3);
  await expect(page.getByRole('button', { name: '确认选择', exact: true })).toHaveCount(0);
  await expect(page.getByTestId('ghost-strategy')).not.toBeEmpty();
  await page.locator('.talent-card').first().click();
  await expect(page.locator('.strategy-detail')).toBeVisible();
  await expect(page.locator('.talent-card').first()).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.talent-card').nth(1).click();
  await expect(page.locator('.talent-card').first()).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.event-panel')).toHaveCount(0);
  await page.getByRole('button', { name: '确认选择', exact: true }).click();
  await expect(page.locator('.event-panel')).toBeVisible();
});

test('四张卡内二次确认，时间在剧情框推进，底栏没有确认', async ({ page }) => {
  await run(page);
  await expect(page.locator('.choice')).toHaveCount(4);
  await expect(page.getByTestId('story-clock')).toContainText('8:00 p.m.');
  await expect(page.locator('.decision-dock [data-testid="confirm-action"]')).toHaveCount(0);
  await page.getByTestId('option-0').click();
  await expect(page.getByTestId('step-label')).toContainText('第 1 步');
  await expect(page.locator('.choice-card.selected [data-testid="confirm-action"]')).toBeVisible();
  await page.getByTestId('option-1').click();
  await expect(page.getByTestId('step-label')).toContainText('第 1 步');
  await page.getByTestId('option-1').click();
  await expect(page.getByTestId('step-label')).toContainText('第 2 步');
  await expect(page.getByTestId('story-clock')).not.toHaveText('8:00 p.m.');
  await expect(page.locator('.resource-bar')).not.toContainText('已过去');
});

test('完整对局每题四项，结算返回主页后可查看记录', async ({ page }) => {
  await run(page);
  for(let i=0;i<12 && !(await page.getByTestId('player-score').count());i++) {
    await expect(page.locator('.choice')).toHaveCount(4);
    await page.locator('.event-story').click();
    await page.locator('.choice:not(:disabled)').first().click();
    await page.getByTestId('confirm-action').click();
  }
  await expect(page.getByTestId('player-score')).toBeVisible();
  await page.getByRole('button', {name:'返回主界面', exact:true}).click();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.getByRole('button',{name:/开启一段人生/})).toBeVisible();
  await page.getByRole('button',{name:/继续上次记录/}).click();
  await expect(page.getByTestId('player-score')).toBeVisible();
});

test('大屏滚动区选中最后一项时，卡内确认完整露出', async ({ page }) => {
  await page.setViewportSize({ width:1440, height:1000 });
  await run(page);
  await page.getByTestId('option-3').click();
  const area = (await page.locator('.choices').boundingBox())!;
  const confirm = (await page.getByTestId('confirm-action').boundingBox())!;
  expect(confirm.y).toBeGreaterThanOrEqual(area.y);
  expect(confirm.y+confirm.height).toBeLessThanOrEqual(area.y+area.height);
});
