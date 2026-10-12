import type { Actor } from "./types";
export function outcomes(a: Actor) {
  return [
    a.delivered.position ? 3 : 0,
    a.delivered.people ? 1 : 0,
    a.light,
    a.briefed ? 1 : 0,
    a.delivered.ack ? 3 : 0,
  ];
}
export function summarize(a: Actor) {
  const value = outcomes(a).reduce((sum, n) => sum + n, 0);
  const cost = (100 - a.energy) / 10;
  const remaining = a.energy / 10;
  return {
    value,
    cost,
    remaining,
    score: value === 0 ? 0 : Math.round((11 * value + remaining) * 10) / 10,
    efficiency: cost ? value / cost : null,
    startups: a.logs.filter((x) => x.action.kind !== "wait" && x.cost > 0)
      .length,
    wasted: a.logs
      .filter((x) => x.interrupted && x.action.kind !== "wait")
      .reduce((sum, x) => sum + x.cost / 10, 0),
  };
}
export function compare(a: Actor, b: Actor) {
  const player = summarize(a),
    ghost = summarize(b),
    delta = Math.round((player.score - ghost.score) * 10) / 10;
  const same = outcomes(a).every((value, i) => value === outcomes(b)[i]);
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
