import { describe, expect, it } from "vitest";
import {
  FULL_ENERGY,
  MAX_ROUNDS,
  MIN_ROUNDS,
  QUESTION_WEIGHT,
  SURVIVAL,
  TIER_WEIGHT,
  idleDrain,
} from "./config";
import { QUESTIONS, QUESTION_BY_ID } from "./content/questions";
import { TALENTS } from "./content/talents";
import { PERSONAS } from "./content/personas";
import {
  PASS_INDEX,
  answer,
  costOf,
  hasAffordable,
  initialActor,
  preview,
  visibleIndexes,
} from "./engine";
import { ghostUpTo } from "./ghost";
import { oracleFor } from "./oracle";
import {
  createSession,
  finish,
  isDone,
  pickTalent,
  step,
  verifyExport,
} from "./replay";
import { compare, summarize, survivalOf } from "./scoring";
import { createWorld } from "./world";
import { stepDuration } from "./timeline";
import type { Session, World } from "./types";

/**
 * 按给定策略打完一局。策略想选的下标买不起时，退到本题最便宜的可行项；
 * 一个都买不起就走放弃通道——模拟真人不会硬点一个点不动的按钮。
 */
function playStraight(w: World, pick: (n: number) => number, talent?: string) {
  let s = createSession(w);
  s = pickTalent(s, talent ?? w.talentChoices[0]);
  let n = 0;
  while (!isDone(s)) {
    const q = QUESTION_BY_ID[s.world.questions[s.step]];
    let idx = pick(n);
    const ok = (i: number) => i >= 0 && preview(w, s.player, q, i).affordable;
    if (!ok(idx)) {
      const fallback = visibleIndexes(w, q).filter(ok).sort(
        (x, y) =>
          preview(w, s.player, q, x).cost - preview(w, s.player, q, y).cost,
      );
      idx = fallback.length > 0 ? fallback[0] : PASS_INDEX;
    }
    s = step(s, idx);
    n++;
  }
  return s;
}

describe("世界与抽题", () => {
  it("每局抽 8~12 道题，且同一编号必然复现", () => {
    const a = createWorld("seed-1");
    const b = createWorld("seed-1");
    expect(a.questions.length).toBeGreaterThanOrEqual(MIN_ROUNDS);
    expect(a.questions.length).toBeLessThanOrEqual(MAX_ROUNDS);
    expect(a.questions.length).toBe(a.rounds);
    expect(a).toEqual(b);
    expect(new Set(a.questions).size).toBe(a.questions.length);
  });
  it("题数本身也是随机的，落在 8~12 之间且不只有一种", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 80; i++) seen.add(createWorld("r" + i).rounds);
    expect(Math.min(...seen)).toBeGreaterThanOrEqual(MIN_ROUNDS);
    expect(Math.max(...seen)).toBeLessThanOrEqual(MAX_ROUNDS);
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });
  it("不同编号抽出不同的题目组合", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++)
      seen.add(createWorld("s" + i).questions.join(","));
    expect(seen.size).toBeGreaterThan(5);
  });
  it("天赋三选一给出三个互不相同的选项", () => {
    for (let i = 0; i < 20; i++) {
      const w = createWorld("t" + i);
      expect(w.talentChoices).toHaveLength(3);
      expect(new Set(w.talentChoices).size).toBe(3);
      for (const id of w.talentChoices)
        expect(TALENTS.some((t) => t.id === id)).toBe(true);
    }
  });
  it("Ghost 性格与天赋都是随机的", () => {
    const p = new Set<string>();
    for (let i = 0; i < 30; i++) p.add(createWorld("g" + i).ghostPersona);
    expect(p.size).toBeGreaterThan(1);
    for (const id of p) expect(PERSONAS.some((x) => x.id === id)).toBe(true);
  });
  it("环境覆盖多个维度", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) seen.add(createWorld("e" + i).env.disaster);
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe("电量与成本", () => {
  it("满电是 1.000%，扣完不会变负", () => {
    const w = createWorld("cost", "A");
    let a = initialActor(null);
    expect(a.energy).toBe(FULL_ENERGY);
    for (const qid of w.questions) {
      const q = QUESTION_BY_ID[qid];
      const i = q.options.reduce(
        (best, o, idx) => (o.cost > q.options[best].cost ? idx : best),
        0,
      );
      if (a.energy >= costOf(q.options[i], w.env, a.talent))
        a = answer(w, a, qid, i);
    }
    expect(a.energy).toBeGreaterThanOrEqual(0);
  });
  it("买不起的选项会被标出来，且不能作答", () => {
    const w = createWorld("poor", "A");
    const a = { ...initialActor(null), energy: 10 };
    const q = QUESTION_BY_ID[w.questions[0]];
    const pricey = q.options.findIndex((o) => o.cost > 10);
    expect(preview(w, a, q, pricey).affordable).toBe(false);
    expect(() => answer(w, a, w.questions[0], pricey)).toThrow("电量不够");
  });
  it("天赋折扣真的生效", () => {
    const w = createWorld("tal", "A");
    const q = QUESTION_BY_ID[w.questions[0]];
    const screenOpt = q.options.find((o) => o.tags.includes("screen"));
    if (!screenOpt) return;
    const plain = costOf(screenOpt, w.env, null);
    const dimmed = costOf(screenOpt, w.env, "dim");
    expect(dimmed).toBeLessThan(plain);
  });
});

describe("环境耦合让最优解不唯一", () => {
  it("同一选项在不同网络环境下收益不同", () => {
    const q = QUESTION_BY_ID["e01"];
    const opt = q.options[0];
    const dead = { ...createWorld("x", "A").env, network: "dead" as const };
    const local = { ...createWorld("x", "A").env, network: "local" as const };
    const deadPts = opt.env?.find((r) => r.in.includes("dead"))?.points ?? 0;
    const localHit = opt.env?.some((r) => r.in.includes("local")) ?? false;
    expect(deadPts).toBeLessThan(0);
    void local;
    expect(localHit).toBe(false);
    void dead;
  });
  it("题库里带环境修正的选项足够多，否则玩家会背答案", () => {
    const withEnv = QUESTIONS.filter((q) =>
      q.options.some((o) => o.env && o.env.length > 0),
    );
    expect(withEnv.length).toBeGreaterThanOrEqual(QUESTIONS.length * 0.4);
  });
  it("题库里带不确定收益的选项占有一定比例", () => {
    const withGamble = QUESTIONS.filter((q) =>
      q.options.some((o) => o.gamble),
    );
    expect(withGamble.length).toBeGreaterThanOrEqual(5);
  });
});

describe("赌运对双方一致", () => {
  it("玩家与 Ghost 在同一题同一选项上抽到同一个结果", () => {
    const w = createWorld("fair");
    const qid = w.questions.find(
      (id) => QUESTION_BY_ID[id].options.some((o) => o.gamble),
    );
    if (!qid) return;
    const q = QUESTION_BY_ID[qid];
    const idx = q.options.findIndex((o) => o.gamble);
    const p = answer(w, initialActor(null), qid, idx);
    const g = answer(w, initialActor(null), qid, idx);
    expect(p.answers[0].gambled[0].won).toBe(g.answers[0].gambled[0].won);
  });
});

describe("Ghost", () => {
  it("Ghost 走同一批题，且随进度推进", () => {
    const w = createWorld("ghost1");
    const g0 = ghostUpTo(w, 0, w.ghostPersona, w.ghostTalent);
    const g5 = ghostUpTo(w, 5, w.ghostPersona, w.ghostTalent);
    const g10 = ghostUpTo(w, w.questions.length, w.ghostPersona, w.ghostTalent);
    expect(g0.answers).toHaveLength(0);
    expect(g5.answers).toHaveLength(5);
    expect(g10.answers).toHaveLength(w.questions.length);
    expect(g10.energy).toBeLessThan(g0.energy);
  });
  it("不同性格会走出不同结果", () => {
    const w = createWorld("ghost2");
    const runs = PERSONAS.map((p) =>
      summarize(ghostUpTo(w, w.questions.length, p.id, w.ghostTalent)),
    );
    expect(new Set(runs.map((r) => r.score)).size).toBeGreaterThan(1);
  });
  it("Ghost 不会超支", () => {
    for (let i = 0; i < 12; i++) {
      const w = createWorld("gb" + i);
      const g = ghostUpTo(w, w.questions.length, w.ghostPersona, w.ghostTalent);
      expect(g.energy).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("一局流程", () => {
  it("选天赋之后才能开始答题", () => {
    const w = createWorld("flow");
    const s = createSession(w);
    expect(() => step(s, 0)).toThrow("还没有选择策略");
    expect(() => pickTalent(s, "不存在的天赋")).toThrow();
  });
  it("答完全部题目即结束，过程中 Ghost 只同步到前一题", () => {
    const w = createWorld("flow2");
    let s = pickTalent(createSession(w), w.talentChoices[0]);
    while (!isDone(s)) {
      const q = QUESTION_BY_ID[s.world.questions[s.step]];
      const idx = visibleIndexes(w, q).find((i) =>
        preview(w, s.player, q, i).affordable,
      );
      s = step(s, idx ?? PASS_INDEX);
      // 玩家做到第 n 题时，Ghost 只露到第 n-1 题，避免照抄
      if (!isDone(s)) expect(s.ghost.answers.length).toBe(Math.max(0, s.step - 1));
    }
    expect(s.step).toBe(w.rounds);
    expect(s.ending).toBe("done");
    // 结算时它必须走完最后一步，否则结算页会少一条记录
    expect(s.ghost.answers.length).toBe(w.rounds);
  });
  it("电量归零也不会卡死：每一道题都还留有能做的选择", () => {
    // 题库约定：每题至少一个 0 成本选项。电量见底时它还在，玩家不会被卡在半路。
    for (const seed of ["drain", "drain2", "drain3"]) {
      const w = createWorld(seed);
      const flat = { ...initialActor(w.talentChoices[0]), energy: 0 };
      for (const id of w.questions) {
        const q = QUESTION_BY_ID[id];
        const ok = hasAffordable(w, flat, q);
        expect(ok, `${id} 在 ${seed} 下没有可做的选择`).toBe(true);
      }
    }
  });
  it("真的一步都走不动时，放弃通道能把这一局出完", () => {
    const w = createWorld("drain");
    let s = pickTalent(createSession(w), w.talentChoices[0]);
    while (!isDone(s)) s = step({ ...s, player: { ...s.player, energy: 0 } }, PASS_INDEX);
    expect(s.ending).toBe("done");
    expect(s.player.answers.length).toBe(w.rounds);
    expect(s.player.answers.every((a) => a.optionIndex === PASS_INDEX)).toBe(true);
    expect(s.player.answers.every((a) => a.cost === 0)).toBe(true);
    expect(s.player.energy).toBe(0);
  });
  it("finish() 会把没答的题一次性空过，直接进结算", () => {
    const w = createWorld("drain");
    const base = pickTalent(createSession(w), w.talentChoices[0]);
    const done = finish(base);
    expect(isDone(done)).toBe(true);
    expect(done.ending).toBe("done");
    expect(done.player.answers.length).toBe(w.rounds);
    expect(
      done.player.answers.filter((a) => a.optionIndex === PASS_INDEX).length,
    ).toBe(w.rounds);
  });
  it("导出记录可以重算回来", () => {
    const w = createWorld("export");
    const s = playStraight(w, () => 1);
    const rebuilt = verifyExport(JSON.parse(JSON.stringify(s)));
    expect(rebuilt.player.energy).toBe(s.player.energy);
    expect(rebuilt.player.delivered).toEqual(s.player.delivered);
  });
  it("成果价值上限高于电量能支撑的范围，逼出取舍", () => {
    const w = createWorld("budget");
    const allCost = w.questions.reduce((sum, id) => {
      const q = QUESTION_BY_ID[id];
      return sum + Math.max(...q.options.map((o) => o.cost));
    }, 0);
    expect(allCost).toBeGreaterThan(FULL_ENERGY);
  });
});

describe("评分", () => {
  it("没有成果时不得分，避免宣传省电胜利", () => {
    expect(summarize(initialActor(null)).score).toBe(0);
  });
  it("成果相同则余量多者更高，但成果优先于余量", () => {
    const w = createWorld("score");
    const a = playStraight(w, () => 0).player;
    const b = playStraight(w, () => 0).player;
    const c = compare(a, { ...b, energy: b.energy - 100 }, w.env);
    expect(c.player.value).toBe(c.ghost.value);
    expect(c.delta).toBeGreaterThan(0);
  });
  it("两种打法能拉开差距", () => {
    const cheapest = (w: World, n: number) => {
      const q = QUESTION_BY_ID[w.questions[n]];
      return q.options.reduce(
        (best, o, i) => (o.cost < q.options[best].cost ? i : best),
        0,
      );
    };
    const richest = (w: World, n: number) => {
      const q = QUESTION_BY_ID[w.questions[n]];
      return q.options.reduce(
        (best, o, i) => (o.cost > q.options[best].cost ? i : best),
        0,
      );
    };
    let differ = 0;
    for (let i = 0; i < 12; i++) {
      const w = createWorld("gap" + i);
      const a = summarize(playStraight(w, (n) => cheapest(w, n)).player);
      const b = summarize(playStraight(w, (n) => richest(w, n)).player);
      if (a.value !== b.value || a.remaining !== b.remaining) differ++;
    }
    expect(differ).toBeGreaterThanOrEqual(10);
  });
  it("什么都不做也留不住电：时间本身在吃电，而且一分不得", () => {
    const w = createWorld("turtle");
    let s = pickTalent(createSession(w), w.talentChoices[0]);
    while (!isDone(s)) s = step(s, PASS_INDEX);
    // 不操作不等于不耗电：每一步推进时间，电池自己往下掉
    expect(s.player.energy).toBeLessThan(FULL_ENERGY);
    expect(s.player.energy).toBeGreaterThan(0);
    expect(s.player.answers.every((a) => a.idleDrain > 0)).toBe(true);
    expect(summarize(s.player).score).toBe(0);
  });
});

describe("v0.3.0：自然损耗、环境耦合与时间", () => {
  it("每步按种子推进约30分钟，且自然损耗一定发生", () => {
    const w = createWorld("idle1");
    let s = pickTalent(createSession(w), w.talentChoices[0]);
    while (!isDone(s)) s = step(s, PASS_INDEX);
    let minutes = 0;
    s.player.answers.forEach((a, i) => {
      const duration = stepDuration(w, i);
      minutes += duration;
      expect(a.minutes).toBe(minutes);
      expect(a.idleDrain).toBe(idleDrain(w.env, duration));
    });
  });

  it("炎热与严寒都比阴凉掉得快", () => {
    const base = createWorld("temp", "A").env;
    const cool = idleDrain({ ...base, temp: "cool", network: "local" });
    const hot = idleDrain({ ...base, temp: "hot", network: "local" });
    const freezing = idleDrain({ ...base, temp: "freezing", network: "local" });
    expect(hot).toBeGreaterThan(cool);
    expect(freezing).toBeGreaterThan(cool);
  });

  it("同一个动作在炎热里更贵", () => {
    const w = createWorld("costly", "A");
    const q = QUESTION_BY_ID[w.questions[0]];
    const opt = q.options.find((o) => o.cost > 0);
    if (!opt) return;
    const cool = costOf(opt, { ...w.env, temp: "cool" }, null);
    const hot = costOf(opt, { ...w.env, temp: "hot" }, null);
    expect(hot).toBeGreaterThan(cool);
  });

  it("电量见底后，不耗电的选项仍然选得动", () => {
    const w = createWorld("dead-battery");
    const flat = { ...initialActor(w.talentChoices[0]), energy: 0 };
    for (const id of w.questions) {
      const q = QUESTION_BY_ID[id];
      expect(hasAffordable(w, flat, q), `${id} 在没电时无路可走`).toBe(true);
      const free = visibleIndexes(w, q).filter(
        (i) => preview(w, flat, q, i).cost === 0,
      );
      expect(free.length, `${id} 没有不耗电的选项`).toBeGreaterThan(0);
      for (const i of free) expect(preview(w, flat, q, i).affordable).toBe(true);
    }
  });
});

describe("v0.3.0：权重档位与存活概率", () => {
  it("档位权重是三档，且确实 3 : 2 : 1", () => {
    expect(TIER_WEIGHT.critical).toBe(3);
    expect(TIER_WEIGHT.important).toBe(2);
    expect(TIER_WEIGHT.minor).toBe(1);
  });

  it("每一步都记下了动作档位、题目权重与时间", () => {
    const w = createWorld("tier");
    const s = playStraight(w, () => 1);
    for (const a of s.player.answers) {
      expect(["critical", "important", "minor"]).toContain(a.tier);
      expect(["critical", "important", "minor"]).toContain(a.qTier);
      expect(a.minutes).toBeGreaterThan(0);
    }
  });

  it("题目权重是两层的第二层：倍率温和，且每局至少一道关键题", () => {
    expect(QUESTION_WEIGHT.critical).toBeGreaterThan(QUESTION_WEIGHT.important);
    expect(QUESTION_WEIGHT.important).toBeGreaterThan(QUESTION_WEIGHT.minor);
    // 题目权重不该压过动作档位，否则玩家会觉得「输在抽题」
    expect(QUESTION_WEIGHT.critical / QUESTION_WEIGHT.minor).toBeLessThan(
      TIER_WEIGHT.critical / TIER_WEIGHT.minor,
    );
    for (let i = 0; i < 20; i++) {
      const w = createWorld("qw" + i);
      const tiers = Object.values(w.questionWeights);
      expect(tiers.length).toBe(w.questions.length);
      expect(tiers.filter((t) => t === "critical").length).toBeGreaterThan(0);
    }
  });

  it("同一道题在不同局里权重会变——这是随机性的一部分", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const w = createWorld("qwv" + i);
      for (const [id, t] of Object.entries(w.questionWeights)) seen.add(`${id}|${t}`);
    }
    const ids = new Set([...seen].map((s) => s.split("|")[0]));
    // 一道题如果只在某一档出现过，说明权重是写死的，不是抽的
    const multi = [...ids].filter(
      (id) => new Set([...seen].filter((s) => s.startsWith(id + "|"))).size > 1,
    );
    expect(multi.length).toBeGreaterThan(5);
  });

  it("存活概率是三段相乘，落在 0~1 之间", () => {
    for (let i = 0; i < 20; i++) {
      const w = createWorld("sv" + i);
      const s = playStraight(w, (n) => n % 2);
      const b = survivalOf(s.player, w.env);
      expect(b.p).toBeGreaterThanOrEqual(0);
      expect(b.p).toBeLessThanOrEqual(1);
      expect(b.found).toBeGreaterThanOrEqual(SURVIVAL.foundBase);
      expect(b.rescue).toBeGreaterThanOrEqual(SURVIVAL.rescueBase);
      expect(b.endure).toBeGreaterThanOrEqual(0.03);
      expect(b.p).toBeCloseTo(b.found * b.rescue * b.endure, 10);
    }
  });

  it("什么都不做的存活概率明显低于认真打", () => {
    const playIdle = (w: World) => {
      let s = pickTalent(createSession(w), w.talentChoices[0]);
      while (!isDone(s)) s = step(s, PASS_INDEX);
      return s.player;
    };
    let worse = 0;
    for (let i = 0; i < 12; i++) {
      const w = createWorld("cmp" + i);
      const idleRun = playIdle(w);
      const busy = playStraight(w, () => 1).player;
      if (survivalOf(idleRun, w.env).p < survivalOf(busy, w.env).p) worse++;
    }
    expect(worse).toBeGreaterThanOrEqual(10);
  });

  it("事后最优参考线不低于任何一条实测路线", () => {
    for (const seed of ["or1", "or2", "or3"]) {
      const w = createWorld(seed);
      const o = oracleFor(w);
      const best = survivalOf(
        playStraight(w, (n) => n % 3, o.talent ?? w.talentChoices[0]).player,
        w.env,
      ).p;
      expect(o.survival.length).toBe(w.rounds + 1);
      expect(o.survival.at(-1)!).toBeGreaterThanOrEqual(best - 1e-9);
    }
  });
});
