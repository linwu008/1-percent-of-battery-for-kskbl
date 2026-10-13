import { expect, test, type Locator } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * 作品演示录屏：录一段真实操作过程，产出 assets/1pct-battery-v1.0.0-demo.mp4。
 *
 * 默认跳过——录一次约 3 分钟，不该拖慢常规回归。要重新生成视频：
 *   1. 确保有 Playwright 自带的 ffmpeg（首次需 `npx playwright install ffmpeg`）
 *   2. RECORD_DEMO=1 npm run test:browser -- tests/demo.spec.ts
 *   3. 用根目录的 _demovideo.py 把 webm 转成带字幕栏与片尾卡的 mp4（步骤见 content/ 交付说明）
 *
 * 录制要点：
 * - 真实浏览器录制，不做后期拼接；节奏跟着页面状态走（等打字机真的打完再推进），
 *   不硬编码 sleep，所以界面改了它也照样对得上。
 * - Playwright 录的视频里没有系统光标，注入一个跟随鼠标的圆环，观众才看得清操作落点。
 * - 案例 A 的步数不写死，一路走到结算页为止。
 * - 每个阶段的相对时间写进 assets/demo-cues.json，供 ffmpeg 加字幕用。
 */
test.use({
  viewport: { width: 1440, height: 900 },
  video: { mode: "on", size: { width: 1440, height: 900 } },
});

test.skip(!process.env.RECORD_DEMO, "设 RECORD_DEMO=1 才录制演示视频");

type Cue = { t: number; text: string };
const cues: Cue[] = [];

test("1% Battery · 作品演示录屏", async ({ page }) => {
  test.setTimeout(20 * 60 * 1000);
  page.setDefaultTimeout(120000);

  const t0 = Date.now();
  const cue = (text: string) => cues.push({ t: (Date.now() - t0) / 1000, text });
  const pause = (ms: number) => page.waitForTimeout(ms);

  /** 把鼠标平滑移到元素中心再停一下，避免视频里出现瞬移。 */
  const glide = async (loc: Locator, settle = 450) => {
    const b = await loc.boundingBox();
    if (!b) return;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 20 });
    await pause(settle);
  };

  const press = async (loc: Locator) => {
    await glide(loc);
    await loc.click();
  };

  const smoothScroll = async (target: number, ms = 1200) => {
    await page.evaluate(
      ({ y, dur }: { y: number; dur: number }) =>
        new Promise<void>((done) => {
          const start = window.scrollY;
          const dist = y - start;
          const begin = performance.now();
          const step = () => {
            const t = Math.min(1, (performance.now() - begin) / dur);
            const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            window.scrollTo(0, start + dist * e);
            if (t < 1) requestAnimationFrame(step);
            else done();
          };
          requestAnimationFrame(step);
        }),
      { y: target, dur: ms },
    );
  };

  /** 滚到某个区块，顶部留一点呼吸空间。 */
  const scrollToEl = async (sel: string, ms = 1200) => {
    const y = await page
      .locator(sel)
      .first()
      .evaluate((el) => el.getBoundingClientRect().top + window.scrollY - 70);
    await smoothScroll(y, ms);
  };

  // 注入跟随光标（只在录屏里可见，不影响任何选择器）
  await page.addInitScript(() => {
    const boot = () => {
      const style = document.createElement("style");
      style.textContent = [
        "#__cursor{position:fixed;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;",
        "border:2px solid rgba(255,255,255,.92);border-radius:50%;pointer-events:none;",
        "z-index:2147483647;transform:translate(-200px,-200px);",
        "box-shadow:0 0 10px rgba(0,0,0,.75),inset 0 0 5px rgba(0,0,0,.5);",
        "transition:width .12s,height .12s,margin .12s,border-color .12s}",
        "#__cursor::after{content:'';position:absolute;left:50%;top:50%;width:3px;height:3px;",
        "margin:-1.5px 0 0 -1.5px;background:#fff;border-radius:50%}",
        "#__cursor.hit{width:14px;height:14px;margin:-7px 0 0 -7px;border-color:#63e6b0}",
      ].join("");
      document.head?.appendChild(style);
      const dot = document.createElement("div");
      dot.id = "__cursor";
      document.body.appendChild(dot);
      window.addEventListener(
        "mousemove",
        (e: MouseEvent) => {
          dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        },
        true,
      );
      window.addEventListener("mousedown", () => dot.classList.add("hit"), true);
      window.addEventListener("mouseup", () => dot.classList.remove("hit"), true);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
  });

  // ─── 1. 封面 ────────────────────────────────────────────────
  await page.goto("/");
  await pause(2000);
  cue("1% Battery · 灾后资源决策模拟");
  await page.mouse.move(540, 620, { steps: 16 });
  await pause(4200);
  await press(page.getByRole("button", { name: "进入模拟器" }));
  await pause(1800);

  // ─── 2. 主页：玩法说明与 Ghost 的介绍 ──────────────────────
  cue("同一个起点，你和 Ghost 各做各的选择");
  await glide(page.locator(".how-to"), 2000);
  await glide(page.locator(".ghost-intro"), 2200);
  const caseA = page.getByRole("button", { name: /案例 A/ });
  await glide(caseA, 1400);
  await caseA.click();
  await pause(1800);

  // ─── 3. 序章：处境逐字打出来 ────────────────────────────────
  cue("开局先讲清楚：你在哪、伤到哪、手里有什么");
  const cont = page.getByRole("button", { name: "继续 · 选择策略" });
  await expect(cont).toBeEnabled({ timeout: 90000 }); // 打字机自然打完，不跳过
  await pause(3200);
  await glide(page.locator(".intro-world"), 2400);
  await press(cont);
  await pause(1600);

  // ─── 4. 策略三选一 ─────────────────────────────────────────
  cue("先定行为倾向：三种策略，一种三选一");
  const cards = page.locator(".talent-card");
  await glide(cards.nth(0), 2600);
  await cards.nth(0).click();
  await pause(3400);
  await glide(cards.nth(1), 1000);
  await cards.nth(1).click();
  await pause(3000);
  await cards.nth(0).click();
  await pause(1600);
  await press(page.getByRole("button", { name: "确认选择", exact: true }));
  await pause(1800);

  // ─── 5. 局内：一步步做决策 ─────────────────────────────────
  cue("每一步推进 25–35 分钟，电量同时被消耗和自然流失");
  const stepLabel = page.getByTestId("step-label");
  const score = page.getByTestId("player-score");
  let step = 1;

  while (!(await score.count()) && step <= 14) {
    await expect(stepLabel).toContainText(`第 ${step} 步`);

    // 前两步完整看剧情，后面几次直接跳到正文，把时长压住
    await pause(500);
    const fast = step > 3;
    if (fast) {
      // 剧情已经打完时这个按钮是 disabled 的，别去点它（会一直等它变可点）
      const skip = page.locator(".skip-type");
      if ((await skip.count()) && (await skip.isEnabled())) await skip.click();
      await pause(600);
    } else {
      await expect(page.locator(".skip-type")).toBeDisabled({ timeout: 90000 });
      await pause(step <= 2 ? 2400 : 1200);
    }

    // 第 2 步顺带展示两个辅助面板
    // 注意：「行动」这两个字在 skip-type 与「行动记录」里也会出现，按 aria-label 精确取
    const tab = (name: string) => page.locator(`.command-tabs button[aria-label="${name}"]`);
    if (step === 2) {
      await press(tab("已知信息"));
      await pause(3000);
      await press(tab("行动记录"));
      await pause(3000);
      await press(tab("行动"));
      await pause(900);
    }

    // 权衡两个选项再落子
    const choices = page.locator(".choice:not(:disabled)");
    const n = await choices.count();
    if (!n) break;
    const pick = n >= 2 ? step % 2 : 0;
    if (n >= 2) await glide(choices.nth(pick === 0 ? 1 : 0), fast ? 700 : 1300);
    await glide(choices.nth(pick), fast ? 800 : 1500);
    await choices.nth(pick).click();
    await pause(fast ? 700 : 1200);

    const before = await page.getByTestId("battery").textContent();
    await press(page.getByTestId("confirm-action"));
    // 确认后：要么电量变了，要么这一步之后本局结束、已经跳到结算页
    await page.waitForFunction(
      (prev) => {
        if (document.querySelector('[data-testid="player-score"]')) return true;
        const b = document.querySelector('[data-testid="battery"]');
        return !!b && b.textContent !== prev;
      },
      before ?? "",
      { timeout: 40000 },
    );
    await pause(step <= 3 ? 2000 : 800);
    step++;
  }

  // ─── 6. 结算页 ─────────────────────────────────────────────
  cue("结算：你和 Ghost 的模拟存活概率");
  await expect(score).toBeVisible({ timeout: 90000 });
  await page.mouse.move(720, 260, { steps: 16 });
  await pause(6200);

  cue("每一步，你和最优可能的距离");
  await scrollToEl(".chart-panel", 1500);
  await pause(5200);

  await scrollToEl(".outcome-panel", 1100);
  await pause(3600);
  await scrollToEl(".explanation", 1100);
  await pause(3400);

  cue("权重在结算才揭晓：动作档位 × 题目权重");
  await scrollToEl(".weight-panel", 1200);
  await pause(4600);

  await press(page.locator(".weight-detail summary"));
  await pause(1200);
  await scrollToEl(".weight-detail", 1000);
  await pause(4600);

  await press(page.locator(".formula summary"));
  await pause(1200);
  await scrollToEl(".formula", 1000);
  await pause(5200);

  await smoothScroll(0, 1600);
  await pause(3200);
  cue("在线试玩与源码见项目说明 · 1% Battery");
  await pause(1500);
});

test.afterAll(() => {
  const out = path.resolve(process.cwd(), "../assets/demo-cues.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(cues, null, 2), "utf8");
  process.stdout.write("\n===CUES===\n" + JSON.stringify(cues) + "\n===END===\n");
});
