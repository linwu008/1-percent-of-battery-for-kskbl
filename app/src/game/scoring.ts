import { FULL_ENERGY, OUTCOME_WEIGHTS, scoreOf } from "./config";
import type { Actor, OutcomeId } from "./types";

export const OUTCOME_IDS = Object.keys(OUTCOME_WEIGHTS) as OutcomeId[];

export function outcomes(a: Actor): number[] {
  return OUTCOME_IDS.map((k) => (a.delivered[k] ? OUTCOME_WEIGHTS[k] : 0));
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
    gambles: a.answers.reduce((s, l) => s + l.gambled.length, 0),
    gamblesWon: a.answers.reduce(
      (s, l) => s + l.gambled.filter((g) => g.won).length,
      0,
    ),
  };
}

export function compare(a: Actor, b: Actor) {
  const player = summarize(a),
    ghost = summarize(b);
  const delta = Math.round((player.score - ghost.score) * 10) / 10;
  const same = outcomes(a).every((v, i) => v === outcomes(b)[i]);
  const saving =
    same && ghost.cost > 0 ? (ghost.cost - player.cost) / ghost.cost : null;
  const label =
    player.value === 0 && ghost.value === 0
      ? "均未形成成果"
      : delta < 0
        ? "落后镜像"
        : delta === 0
          ? "与镜像持平"
          : delta <= 3
            ? "略有突破"
            : delta <= 11
              ? "明显突破"
              : "大幅突破";
  return { player, ghost, delta, saving, label };
}

/** 电量百分比，固定三位小数：0.745% */
export function pct(energy: number): string {
  return `${(energy / FULL_ENERGY).toFixed(3)}%`;
}
