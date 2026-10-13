import { describe, expect, it } from "vitest";
import { FULL_ENERGY, OUTCOME_WEIGHTS } from "./config";
import { QUESTION_BY_ID } from "./content/questions";
import { PASS_INDEX, preview, visibleIndexes } from "./engine";
import { oracleFor } from "./oracle";
import { createSession, isDone, pickTalent, step } from "./replay";
import { compare, summarize, survivalOf } from "./scoring";
import { createWorld } from "./world";
import type { Session, World } from "./types";

/** 选项的「期望成果点」：确定收益照算，赌运按概率折算。 */
function expectedPoints(
  p: ReturnType<typeof preview>,
): number {
  const g = p.gain ? p.gain.points * (OUTCOME_WEIGHTS[p.gain.outcome] ?? 1) : 0;
  const b = p.gamble
    ? p.gamble.points * p.gamble.odds * (OUTCOME_WEIGHTS[p.gamble.outcome] ?? 1)
    : 0;
  return g + b;
}

type Pick = (
  world: World,
  s: Session,
  cands: { index: number; points: number; cost: number }[],
) => number;

/** 激进派：每步都挑能买得起的最高收益。它会很快把电烧光。 */
const spender: Pick = (_w, _s, c) =>
  c.reduce((b, x) => (x.points > b.points ? x : b), c[0]).index;

/** 保守派：每步只挑最便宜的有收益项，尽量把电留到最后。 */
const miser: Pick = (_w, _s, c) =>
  c.reduce((b, x) => (x.cost < b.cost ? x : b), c[0]).index;

/** 性价比派：单位电量换来的成果最多。 */
const thrifty: Pick = (_w, _s, c) =>
  c.reduce(
    (b, x) => (x.points / Math.max(x.cost, 1) > b.points / Math.max(b.cost, 1) ? x : b),
    c[0],
  ).index;

function play(w: World, pick: Pick, talent?: string): Session {
  let s = pickTalent(createSession(w), talent ?? w.talentChoices[0]);
  while (!isDone(s)) {
    const q = QUESTION_BY_ID[s.world.questions[s.step]];
    const cands = visibleIndexes(w, q)
      .map((i) => {
        const p = preview(w, s.player, q, i);
        return { index: i, cost: p.cost, points: expectedPoints(p), ok: p.affordable };
      })
      .filter((x) => x.ok && x.points > 0);
    s = step(s, cands.length ? pick(w, s, cands) : PASS_INDEX);
  }
  return s;
}

const SEEDS = Array.from({ length: 40 }, (_, i) => "bal" + i);
const run = (pick: Pick) => SEEDS.map((s) => summarize(play(createWorld(s), pick).player));

describe("平衡性：1% 电量必须是真的约束", () => {
  it("激进派会把电烧掉大半，说明电量是硬约束", () => {
    const runs = run(spender);
    const spent = runs.reduce((a, r) => a + r.spent, 0) / runs.length;
    expect(spent).toBeGreaterThan(FULL_ENERGY * 0.7);
  });

  it("三种打法都拿不到全部六项成果", () => {
    for (const [name, pick] of [
      ["激进", spender],
      ["保守", miser],
      ["性价比", thrifty],
    ] as const) {
      const full = run(pick).filter((r) => r.value === 12);
      expect(full.length, `${name}派拿到满值 ${full.length} 局`).toBe(0);
    }
  });

  it("成果分布合理：不是颗粒无收，也不是随便满分", () => {
    for (const pick of [spender, miser, thrifty]) {
      const runs = run(pick);
      const mean = runs.reduce((a, r) => a + r.value, 0) / runs.length;
      expect(mean).toBeGreaterThan(2);
      expect(mean).toBeLessThan(9);
    }
  });

  it("没有一种打法能通吃：至少两种打法互有胜负", () => {
    const a = run(spender).map((r) => r.score);
    const b = run(miser).map((r) => r.score);
    const c = run(thrifty).map((r) => r.score);
    const wins = (x: number[], y: number[]) => x.filter((v, i) => v > y[i]).length;
    // 激进赢保守的局数，与保守赢激进的局数，都不能是压倒性的
    expect(wins(a, b)).toBeGreaterThan(0);
    expect(wins(b, a)).toBeGreaterThan(0);
    expect(wins(c, a)).toBeGreaterThan(0);
    expect(wins(a, c)).toBeGreaterThan(0);
  });

  it("不同局的结果差异够大，玩家背不出一套固定打法", () => {
    const scores = new Set(run(thrifty).map((r) => r.score));
    expect(scores.size).toBeGreaterThan(20);
  });

  it("与镜像的对照结论不是一边倒", () => {
    const labels = SEEDS.map((s) => {
      const w = createWorld(s);
      const done = play(w, thrifty);
      return compare(done.player, done.ghost, w.env).label;
    });
    expect(new Set(labels).size).toBeGreaterThan(1);
    expect(labels.filter((l) => l === "落后镜像").length).toBeLessThan(SEEDS.length);
  });

  it("全走最贵的路必然破产——取舍由此而来", () => {
    let broke = 0;
    for (const s of SEEDS) {
      const w = createWorld(s);
      let s2 = pickTalent(createSession(w), w.talentChoices[0]);
      for (const qid of w.questions) {
        const q = QUESTION_BY_ID[qid];
        const idx = visibleIndexes(w, q).reduce(
          (b, i) => (q.options[i].cost > q.options[b].cost ? i : b),
          visibleIndexes(w, q)[0],
        );
        const p = preview(w, s2.player, q, idx);
        if (p.affordable) s2 = step(s2, idx);
        else {
          broke++;
          break;
        }
      }
    }
    expect(broke).toBeGreaterThan(SEEDS.length * 0.5);
  });
});

describe("平衡性：存活概率（v0.4.0）", () => {
  /** 按存活概率口径跑一批种子。 */
  const surv = (pick: Pick) =>
    SEEDS.map((s) => {
      const w = createWorld(s);
      return survivalOf(play(w, pick).player, w.env);
    });

  it("事后最优落在 70% 上下——理论上限够高，才有往上够的余地", () => {
    const ps = SEEDS.map((s) => {
      const w = createWorld(s);
      const o = oracleFor(w);
      return o.survival[o.survival.length - 1];
    });
    const mean = ps.reduce((a, b) => a + b, 0) / ps.length;
    expect(mean, `事后最优均值 ${(mean * 100).toFixed(1)}%`).toBeGreaterThan(0.65);
    expect(mean, `事后最优均值 ${(mean * 100).toFixed(1)}%`).toBeLessThan(0.76);
    // 40 个种子 × beam 搜索在慢机器上会超过 vitest 默认的 5s。这不是功能问题，
    // 是这条断言本身算得久，所以单独放宽它的超时，不要靠调小种子数来"让它过"。
  }, 60000);

  it("三种打法都拿不到接近 100% 的存活概率", () => {
    for (const [name, pick] of [
      ["激进", spender],
      ["保守", miser],
      ["性价比", thrifty],
    ] as const) {
      const runs = surv(pick);
      const max = Math.max(...runs.map((r) => r.p));
      expect(max, `${name}派最高 ${(max * 100).toFixed(1)}%`).toBeLessThan(0.9);
    }
  });

  it("三段概率都还有余量，没有哪一段被压死", () => {
    const w = createWorld("segments");
    const o = oracleFor(w);
    // 事后最优走完时，三段都必须在合理区间——否则乘积永远上不去
    const last = o.survival[o.survival.length - 1];
    expect(last).toBeGreaterThan(0.3);
    // 真人打法的均值也必须站得住
    const ps = surv(thrifty).map((r) => r.p);
    const mean = ps.reduce((a, b) => a + b, 0) / ps.length;
    expect(mean, `性价比均值 ${(mean * 100).toFixed(1)}%`).toBeGreaterThan(0.35);
  });

  it("好打法与不做事之间必须拉开明显差距", () => {
    const idle = SEEDS.map((s) => {
      const w = createWorld(s);
      let sess = pickTalent(createSession(w), w.talentChoices[0]);
      while (!isDone(sess)) sess = step(sess, PASS_INDEX);
      return survivalOf(sess.player, w.env).p;
    });
    const good = surv(thrifty).map((r) => r.p);
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(mean(good)).toBeGreaterThan(mean(idle) * 5);
  });

  it("存活概率不是清一色地低：好打法能拉开区间", () => {
    for (const pick of [spender, thrifty]) {
      const runs = surv(pick).map((r) => r.p);
      const mean = runs.reduce((a, b) => a + b, 0) / runs.length;
      expect(mean, `均值 ${(mean * 100).toFixed(1)}%`).toBeGreaterThan(0.15);
      expect(new Set(runs.map((r) => Math.round(r * 100))).size).toBeGreaterThan(10);
    }
  });

  it("耗电更强的版本下，激进派确实会被电量卡住", () => {
    const runs = SEEDS.map((s) => {
      const w = createWorld(s);
      return play(w, spender).player;
    });
    const drained = runs.filter((a) => a.energy < FULL_ENERGY * 0.15).length;
    expect(drained).toBeGreaterThan(0);
  });
});
