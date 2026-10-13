import { pick } from "./rng";
import type { Actor, World } from "./types";

/** 同一步的时长只由世界种子决定，玩家、Ghost 与事后参考线共享。下标从0开始。 */
export function stepDuration(world: World, index: number): number {
  return pick(world.seed, `duration:${index}`, [25, 30, 35]);
}

/** 日志记录的是累计分钟数；阅读与思考不会产生新日志，也不会推进时间。 */
export function elapsedMinutes(actor: Actor): number {
  return actor.answers.at(-1)?.minutes ?? 0;
}

/** 用世界的起始时段显示钟表时间，不依赖玩家电脑的日期、时区或真实耗时。 */
export function clockLabel(world: World, minutes: number): string {
  const start = { day: 12 * 60, dusk: 18 * 60, night: 20 * 60 }[world.env.daylight];
  const total = start + minutes;
  const days = Math.floor(total / (24 * 60));
  const hour = Math.floor(total / 60) % 24;
  const minute = total % 60;
  const dayLabel = days === 0 ? "" : days === 1 ? "次日 " : `第${days + 1}天 `;
  return `${dayLabel}${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "p.m." : "a.m."}`;
}
