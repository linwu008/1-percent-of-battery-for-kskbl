import { test, expect } from '@playwright/test';

test('剧情独立于策略；重复选择收起详情；电池在右而Ghost在底部', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', {name:'进入模拟器'}).click();
  await page.getByRole('button', {name:/案例 A/}).click();
  await expect(page.locator('.backdrop-card')).toBeVisible();
  await expect(page.locator('.talent-card')).toHaveCount(0);
  await page.locator('.backdrop-card').click();
  await page.getByRole('button', {name:'继续 · 选择策略'}).click();
  await expect(page.locator('.backdrop-card')).toHaveCount(0);
  await page.locator('.talent-card').first().click();
  await expect(page.locator('.strategy-detail')).toBeVisible();
  await page.locator('.talent-card').first().click();
  await expect(page.locator('.strategy-detail')).toHaveCount(0);
  await page.locator('.talent-card').nth(1).click();
  await page.getByRole('button', {name:'确认选择',exact:true}).click();
  const event=(await page.locator('.event-panel').boundingBox())!;
  const battery=(await page.locator('.player-battery-panel').boundingBox())!;
  const ghost=(await page.locator('.ghost-card').boundingBox())!;
  expect(battery.x).toBeGreaterThanOrEqual(event.x+event.width);
  expect(Math.abs(battery.y-event.y)).toBeLessThan(2);
  expect(ghost.y).toBeGreaterThanOrEqual(event.y+event.height);
  await expect(page.locator('.player-battery-panel .ghost-card')).toHaveCount(0);
  await expect(page.getByTestId('battery')).toContainText('1.000%');
  await expect(page.locator('.pixel-cell.lit')).toHaveCount(20);
  for(const width of [800,900]) {
    await page.setViewportSize({width,height:900});
    const story=(await page.locator('.event-panel').boundingBox())!;
    const player=(await page.locator('.player-battery-panel').boundingBox())!;
    expect(player.x).toBeGreaterThanOrEqual(story.x+story.width);
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('.event-story').click();
  await page.locator('.choice:not(:disabled)').first().click();
  await page.getByTestId('confirm-action').click();
  await expect(page.getByTestId('battery')).not.toContainText('1.000%');
  const remaining=Number.parseFloat((await page.getByTestId('battery').textContent())!);
  await expect(page.locator('.pixel-cell.lit')).toHaveCount(Math.ceil(remaining*20));
});

test('主页与结算在宽窄屏都不溢出，概率标签紧邻数值', async ({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'进入模拟器'}).click();
  await page.screenshot({path:'test-results/v07-home.png',fullPage:true});
  await page.getByRole('button',{name:/案例 A/}).click();
  await page.locator('.backdrop-card').click();
  await page.getByRole('button',{name:'继续 · 选择策略'}).click();
  await page.locator('.talent-card').first().click();
  await page.screenshot({path:'test-results/v07-strategy.png',fullPage:true});
  await page.getByRole('button',{name:'确认选择',exact:true}).click();
  await page.locator('.event-story').click();
  await page.screenshot({path:'test-results/v07-event.png',fullPage:true});
  for(let i=0;i<12 && !(await page.getByTestId('player-score').count());i++) {
    await page.locator('.event-story').click();
    await page.locator('.choice:not(:disabled)').first().click();
    await page.getByTestId('confirm-action').click();
  }
  await expect(page.locator('.result-summary dt')).toHaveText(['相对 Ghost 存活概率','历史最高存活概率（跨版本）']);
  for(const width of [1440,1024,390]) {
    await page.setViewportSize({width,height:1000});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
    expect(await page.locator('.result-summary').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBeTruthy();
    const heading=page.locator('.sbar-heading').first();
    const label=(await heading.locator('span').boundingBox())!;
    const number=(await heading.locator('b').boundingBox())!;
    expect(number.x-label.x-label.width).toBeLessThan(12);
    if(width===390) {
      const replay=(await page.getByRole('button',{name:'同一局再试',exact:true}).boundingBox())!;
      expect(replay.width).toBeGreaterThan(200);
    }
    await page.screenshot({path:`test-results/v07-results-${width}.png`,fullPage:true});
  }
});
