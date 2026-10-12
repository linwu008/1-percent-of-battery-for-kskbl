import {
  FULL_ENERGY,
  OUTCOME_THRESHOLD,
  OUTCOME_WEIGHTS,
  OUTCOME_LABELS,
  STEP_MINUTES,
  costFactor,
  defaultTier,
  idleDrain,
} from "./config";
import { TALENT_BY_ID } from "./content/talents";
import { QUESTION_BY_ID } from "./content/questions";
import { gambleRoll } from "./rng";
import { survivalOf } from "./scoring";
import type {
  Actor,
  AnswerLog,
  Env,
  Gain,
  Option,
  OutcomeId,
  Question,
  Tag,
  WeightTier,
  World,
} from "./types";

export const OUTCOME_IDS = Object.keys(OUTCOME_WEIGHTS) as OutcomeId[];

/** 放弃本题的下标。电量不够任何选项时，玩家用它把这一题空过去。 */
export const PASS_INDEX = -1;

/** 只显示与当前环境相符的选项（onlyIf 不匹配的不出现）。 */
export function visibleIndexes(w: World, q: Question): number[] {
  return q.options
    .map((opt, i) => ({ opt, i }))
    .filter(
      ({ opt }) =>
        !opt.onlyIf || opt.onlyIf.in.includes(String(w.env[opt.onlyIf.key])),
    )
    .map(({ i }) => i);
}

/** 这一题还有没有买得起的选项。没有就得走放弃通道。 */
export function hasAffordable(w: World, a: Actor, q: Question): boolean {
  return visibleIndexes(w, q).some((i) => preview(w, a, q, i).affordable);
}

/** 选项的权重档位。题库没写的按成本与是否有收益推。 */
export function tierOf(opt: Option): WeightTier {
  return opt.weight ?? defaultTier(opt.cost, !!(opt.gain || opt.gamble));
}

export function initialActor(talent: string | null = null): Actor {
  return {
    energy: FULL_ENERGY,
    points: Object.fromEntries(OUTCOME_IDS.map((k) => [k, 0])) as Record<
      OutcomeId,
      number
    >,
    delivered: Object.fromEntries(OUTCOME_IDS.map((k) => [k, false])) as Record<
      OutcomeId,
      boolean
    >,
    talent,
    answers: [],
  };
}

/**
 * 天赋与环境共同决定这一下真正要花多少电。
 * 环境系数在先（同一个动作在炎热里更贵），天赋折扣在后。
 */
export function costOf(opt: Option, env: Env, talentId: string | null): number {
  const talent = talentId ? TALENT_BY_ID[talentId] : undefined;
  let cost = Math.round(opt.cost * costFactor(env, opt.tags));
  if (talent?.discount && opt.tags.some((t) => talent.discount!.tags.includes(t)))
    cost = Math.round(cost * (1 - talent.discount.rate));
  if (
    talent?.shield &&
    talent.shield.in.includes(String(env[talent.shield.key]))
  )
    cost = Math.round(cost * (1 - talent.shield.rate));
  if (talent?.refund && opt.tags.some((t) => talent.refund!.tags.includes(t)))
    cost -= talent.refund.amount;
  return Math.max(0, cost);
}

/** 环境修正：同一选项在不同局里值不值，答案不一样。 */
function envDelta(opt: Option, env: Env): { points: number; notes: string[] } {
  if (!opt.env) return { points: 0, notes: [] };
  let points = 0;
  const notes: string[] = [];
  for (const rule of opt.env)
    if (rule.in.includes(String(env[rule.key]))) {
      points += rule.points;
      notes.push(rule.note);
    }
  return { points, notes };
}

export interface Preview {
  cost: number;
  /** 这一步自然损耗掉的电：不操作也掉 */
  idle: number;
  tier: WeightTier;
  /** 确定收益（已含环境修正与天赋加成），未达门槛也会显示进度 */
  gain: { outcome: OutcomeId; points: number } | null;
  gamble: { outcome: OutcomeId; points: number; odds: number; hint: string } | null;
  notes: string[];
  affordable: boolean;
  reason?: string;
}

export function preview(
  w: World,
  a: Actor,
  q: Question,
  index: number,
): Preview {
  const opt = q.options[index];
  const cost = costOf(opt, w.env, a.talent);
  const idle = idleDrain(w.env);
  const delta = envDelta(opt, w.env);
  const talent = a.talent ? TALENT_BY_ID[a.talent] : undefined;
  let gain = opt.gain
    ? {
        outcome: opt.gain.outcome,
        points:
          opt.gain.points +
          delta.points +
          (talent?.boost?.outcomes.includes(opt.gain.outcome)
            ? talent.boost.points
            : 0),
      }
    : null;
  if (gain && gain.points <= 0) gain = null;
  const gamble = opt.gamble
    ? {
        outcome: opt.gamble.outcome,
        points: Math.max(
          0,
          opt.gamble.points +
            delta.points +
            (talent?.boost?.outcomes.includes(opt.gamble.outcome)
              ? talent.boost.points
              : 0),
        ),
        odds: opt.gamble.odds,
        hint: opt.gamble.hint,
      }
    : null;
  // 能否做，只看动作本身买不买得起。
  // 那 15 分钟的自然损耗无论如何都会发生，买不起就少扣点、扣到 0 为止——
  // 这样电量见底时「不耗电」的选项仍然选得动，玩家不会被卡死在半路。
  const affordable = a.energy >= cost;
  return {
    cost,
    idle,
    tier: tierOf(opt),
    gain,
    gamble: gamble && gamble.points > 0 ? gamble : null,
    notes: delta.notes,
    affordable,
    reason: affordable ? undefined : "电量不够",
  };
}

function applyGain(a: Actor, outcome: OutcomeId, points: number): boolean {
  if (points <= 0) return false;
  const before = a.delivered[outcome];
  a.points[outcome] += points;
  if (a.points[outcome] >= OUTCOME_THRESHOLD[outcome]) a.delivered[outcome] = true;
  return !before && a.delivered[outcome];
}

/**
 * 收尾：记录这一步过去的时间、扣掉自然损耗，并算出这一步结束时的存活概率。
 * 不耗电的等待也算 15 分钟，也要付自然损耗——电池不等人。
 */
function settle(w: World, a: Actor, log: Omit<AnswerLog, "minutes" | "idleDrain" | "survival">): Actor {
  const next: Actor = structuredClone(a);
  const idle = Math.min(idleDrain(w.env), next.energy);
  next.energy = Math.max(0, next.energy - idle);
  const minutes = (a.answers.length + 1) * STEP_MINUTES;
  next.answers.push({
    ...log,
    idleDrain: idle,
    minutes,
    survival: 0,
  } as AnswerLog);
  next.answers[next.answers.length - 1].survival = survivalOf(next, w.env).p;
  return next;
}

export function answer(
  w: World,
  a: Actor,
  questionId: string,
  index: number,
): Actor {
  const q = QUESTION_BY_ID[questionId];
  if (!q) throw new Error("未知题目");
  const opt = q.options[index];
  if (!opt) throw new Error("选项不存在");
  const p = preview(w, a, q, index);
  if (!p.affordable) throw new Error("电量不够完成这个选择");

  const next: Actor = structuredClone(a);
  next.energy -= p.cost;

  const gained: Gain[] = [];
  const gambled: AnswerLog["gambled"] = [];
  const texts: string[] = [];

  if (p.gain) {
    if (applyGain(next, p.gain.outcome, p.gain.points))
      texts.push(OUTCOME_LABELS[p.gain.outcome]);
    else texts.push(`${OUTCOME_LABELS[p.gain.outcome]}推进了一点`);
    gained.push(p.gain);
  }
  if (p.gamble) {
    // 成败由本局种子预先抽定：玩家与 Ghost 抽到的是同一个结果。
    const roll = gambleRoll(w.seed, questionId, index);
    const won = roll < p.gamble.odds;
    if (won) {
      if (applyGain(next, p.gamble.outcome, p.gamble.points))
        texts.push(OUTCOME_LABELS[p.gamble.outcome]);
      else texts.push(`${OUTCOME_LABELS[p.gamble.outcome]}推进了一点`);
    } else texts.push("这一下没有换来结果");
    gambled.push({ outcome: p.gamble.outcome, points: p.gamble.points, won });
  }
  if (!p.gain && !p.gamble) texts.push("什么也没做，时间照样过去");

  return settle(w, next, {
    questionId,
    optionIndex: index,
    label: opt.label,
    cost: p.cost,
    tier: p.tier,
    gained,
    gambled,
    note: [...texts, ...p.notes].join("；"),
    energyAfter: next.energy,
  });
}

/** 什么也不做：也过 15 分钟，也掉自然损耗，但没有成果。 */
export function pass(w: World, a: Actor, questionId: string): Actor {
  const q = QUESTION_BY_ID[questionId];
  if (!q) throw new Error("未知题目");
  return settle(w, a, {
    questionId,
    optionIndex: PASS_INDEX,
    label: "攥着手机，什么也没做",
    cost: 0,
    tier: "minor",
    gained: [],
    gambled: [],
    note: "剩下这点电，哪一样都撑不起来了。时间照样往前走。",
    energyAfter: a.energy,
  });
}
