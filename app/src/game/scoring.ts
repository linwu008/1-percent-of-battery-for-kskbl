import {
  FULL_ENERGY,
  OUTCOME_WEIGHTS,
  QUESTION_WEIGHT,
  SURVIVAL,
  TIER_WEIGHT,
  scoreOf,
  survivalFrom,
  type SurvivalBreakdown,
} from "./config";
import type { Actor, AnswerLog, Env, OutcomeId, WeightTier } from "./types";

export const OUTCOME_IDS = Object.keys(OUTCOME_WEIGHTS) as OutcomeId[];

const FOUND = new Set<string>(SURVIVAL.foundOutcomes);
const RESCUE = new Set<string>(SURVIVAL.rescueOutcomes);

export function outcomes(a: Actor): number[] {
  return OUTCOME_IDS.map((k) => (a.delivered[k] ? OUTCOME_WEIGHTS[k] : 0));
}

/**
 * 加权贡献分：每一步贡献 = 成果点数 × 选项档位权重 × 题目权重。
 * 同样 2 点，落在「最重要」的关键题上算 2×3×1.5 = 9 分，
 * 落在「不重要」的铺垫题上只有 2×1×1.0 = 2 分。
 */
export function contributions(a: Actor): {
  found: number;
  rescue: number;
  /** 按选项档位归类（已含题目权重的放大） */
  byTier: Record<WeightTier, number>;
  /** 按题目权重归类 */
  byQuestionTier: Record<WeightTier, number>;
} {
  const zero = (): Record<WeightTier, number> => ({ critical: 0, important: 0, minor: 0 });
  const byTier = zero();
  const byQuestionTier = zero();
  let found = 0;
  let rescue = 0;
  for (const log of a.answers) {
    const mul = (TIER_WEIGHT[log.tier] ?? 1) * (QUESTION_WEIGHT[log.qTier] ?? 1);
    const gains = [
      ...log.gained.map((g) => g.points),
      ...log.gambled.filter((g) => g.won).map((g) => g.points),
    ];
    const add = gains.reduce((s, p) => s + p, 0) * mul;
    if (add <= 0) continue;
    byTier[log.tier] = (byTier[log.tier] ?? 0) + add;
    byQuestionTier[log.qTier] = (byQuestionTier[log.qTier] ?? 0) + add;
    for (const g of log.gained) {
      const pts = g.points * mul;
      if (FOUND.has(g.outcome)) found += pts;
      if (RESCUE.has(g.outcome)) rescue += pts;
    }
    for (const g of log.gambled) {
      if (!g.won) continue;
      const pts = g.points * mul;
      if (FOUND.has(g.outcome)) found += pts;
      if (RESCUE.has(g.outcome)) rescue += pts;
    }
  }
  return { found, rescue, byTier, byQuestionTier };
}

/** 单条答题记录的加权贡献：给结算页逐题对照用。 */
export function logContribution(log: AnswerLog): number {
  const mul = (TIER_WEIGHT[log.tier] ?? 1) * (QUESTION_WEIGHT[log.qTier] ?? 1);
  const gains = [
    ...log.gained.map((g) => g.points),
    ...log.gambled.filter((g) => g.won).map((g) => g.points),
  ];
  return gains.reduce((s, p) => s + p, 0) * mul;
}

export function survivalOf(a: Actor, env: Env): SurvivalBreakdown {
  const c = contributions(a);
  const remaining = a.energy / FULL_ENERGY;
  return survivalFrom(c.found, c.rescue, remaining, a.answers.length, env);
}

/** 每一步结束时的存活概率，首尾都算上，用来画曲线。 */
export function survivalSeries(a: Actor, env: Env): number[] {
  const start = survivalFrom(0, 0, 1, 0, env).p;
  return [start, ...a.answers.map((l) => l.survival)];
}

export function summarize(a: Actor) {
  const value = outcomes(a).reduce((s, n) => s + n, 0);
  const remaining = a.energy / FULL_ENERGY; // 0 ~ 1.000
  const cost = 1 - remaining;
  return {
    value,
    cost: Math.round(cost * 1000) / 1000,
    remaining: Math.round(remaining * 1000) / 1000,
    score: scoreOf(value, remaining),
    efficiency: cost > 0 ? Math.round((value / (cost * 10)) * 100) / 100 : null,
    spent: a.answers.reduce((s, l) => s + l.cost, 0),
    idle: a.answers.reduce((s, l) => s + l.idleDrain, 0),
    minutes: a.answers.length ? a.answers[a.answers.length - 1].minutes : 0,
    gambles: a.answers.reduce((s, l) => s + l.gambled.length, 0),
    gamblesWon: a.answers.reduce(
      (s, l) => s + l.gambled.filter((g) => g.won).length,
      0,
    ),
  };
}

export function compare(a: Actor, b: Actor, env: Env) {
  const player = summarize(a);
  const ghost = summarize(b);
  const ps = survivalOf(a, env);
  const gs = survivalOf(b, env);
  // 差距用百分点表示，直观
  const delta = Math.round((ps.p - gs.p) * 1000) / 10;
  const same = outcomes(a).every((v, i) => v === outcomes(b)[i]);
  const saving =
    same && ghost.cost > 0 ? (ghost.cost - player.cost) / ghost.cost : null;
  const label =
    ps.p < 0.02 && gs.p < 0.02
      ? "没能撑住"
      : delta < -1
        ? "落后镜像"
        : Math.abs(delta) <= 1
          ? "与镜像持平"
          : delta <= 5
            ? "略有突破"
            : delta <= 15
              ? "明显突破"
              : "大幅突破";
  return { player, ghost, delta, saving, label, ps, gs };
}

/** 电量百分比，固定三位小数：0.745% */
export function pct(energy: number): string {
  return `${(energy / FULL_ENERGY).toFixed(3)}%`;
}
