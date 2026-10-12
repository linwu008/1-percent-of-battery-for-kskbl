import { FULL_ENERGY, OUTCOME_WEIGHTS } from "./config";
import { PERSONA_BY_ID } from "./content/personas";
import { QUESTION_BY_ID } from "./content/questions";
import { answer, costOf, initialActor, pass } from "./engine";
import type { Actor, Option, Profile, World } from "./types";

/**
 * Ghost 是一条独立的习惯：同一批题，同一个赌运，另一种花法。
 * 它不做最优解——性格决定了它看重便宜、看重收益，还是看重冒险。
 */
function scoreOption(
  opt: Option,
  w: World,
  a: Actor,
  personaId: string,
): number {
  const p = PERSONA_BY_ID[personaId];
  if (!p) return 0;
  const cost = costOf(opt, w.env, a.talent);
  if (cost > a.energy) return -Infinity;

  let s = 0;
  // 越便宜越讨它喜欢
  s += p.w.cheap * (1 - Math.min(1, cost / 250));
  // 收益按成果权重折算
  const gainOutcome = opt.gain?.outcome ?? opt.gamble?.outcome;
  if (gainOutcome) {
    const weight = OUTCOME_WEIGHTS[gainOutcome] ?? 1;
    const points = opt.gain?.points ?? opt.gamble?.points ?? 0;
    s += p.w.gain * (points / 3) * (weight / 3);
  }
  // 对没把握的事的态度
  if (opt.gamble) s += p.w.gamble;
  // 性格偏好的标签
  if (opt.tags.some((t) => p.w.tags.includes(t))) s += 0.8;
  // 牵涉到别人的选项
  if (opt.tags.includes("social")) s += p.w.social * 0.4;
  return s;
}

export function ghostStep(
  w: World,
  questionId: string,
  personaId: string,
  talentId: string,
  a: Actor,
): Actor {
  const q = QUESTION_BY_ID[questionId];
  if (!q) return a;
  let best = -Infinity;
  let bestIndex = 0;
  q.options.forEach((opt, i) => {
    if (opt.onlyIf && !opt.onlyIf.in.includes(String(w.env[opt.onlyIf.key])))
      return;
    const s = scoreOption(opt, w, a, personaId);
    if (s > best) {
      best = s;
      bestIndex = i;
    }
  });
  // 全都买不起就跳过这一题——它也会攥着手机干瞪眼
  if (!Number.isFinite(best)) return pass(w, a, questionId);
  return answer(w, a, questionId, bestIndex);
}

/** 重放 Ghost 的前 n 道题。玩家做到第 n 题时，只能看到它前 n 题的状态。 */
export function ghostUpTo(
  w: World,
  n: number,
  personaId: string,
  talentId: string,
): Actor {
  let a = initialActor(talentId);
  for (let i = 0; i < Math.min(n, w.questions.length); i++)
    a = ghostStep(w, w.questions[i], personaId, talentId, a);
  return a;
}

export function fullEnergyRatio(a: Actor): number {
  return a.energy / FULL_ENERGY;
}

export function emptyProfile(): Profile {
  return { schema: 2, completed: [], best: 0 };
}

export type { Actor };
