import { FULL_ENERGY, survivalFrom } from "./config";
import { QUESTION_BY_ID } from "./content/questions";
import { initialActor, PASS_INDEX, pass, preview, visibleIndexes, answer } from "./engine";
import { survivalOf } from "./scoring";
import type { Actor, Session, World } from "./types";

/**
 * 事后最优参考线（回顾视角）。
 *
 * 它知道本局的全部赌运结果与环境，用定向搜索找出理论上限——
 * 这不是「标准答案」，玩家在当时不可能知道那些信息。
 * 这条线的作用只有一个：让人看见自己的哪一步偏离了上限。
 */

const BEAM = 20;

interface Node {
  actor: Actor;
  choices: number[];
}

function keyOf(a: Actor): string {
  return `${a.energy}|${Object.values(a.points).join(",")}`;
}

function runTalent(w: World, talentId: string): Node {
  let beam: Node[] = [{ actor: initialActor(talentId), choices: [] }];
  for (let s = 0; s < Math.min(w.rounds, w.questions.length); s++) {
    const qid = w.questions[s];
    const q = qid ? QUESTION_BY_ID[qid] : undefined;
    if (!q) break;
    const pool = new Map<string, Node>();
    for (const node of beam) {
      for (const i of visibleIndexes(w, q)) {
        const p = preview(w, node.actor, q, i);
        if (!p.affordable) continue;
        const next = {
          actor: answer(w, node.actor, qid!, i),
          choices: [...node.choices, i],
        };
        const k = keyOf(next.actor);
        if (!pool.has(k)) pool.set(k, next);
      }
      const skipped = {
        actor: pass(w, node.actor, qid!),
        choices: [...node.choices, PASS_INDEX],
      };
      const ks = keyOf(skipped.actor);
      if (!pool.has(ks)) pool.set(ks, skipped);
    }
    const list = [...pool.values()];
    list.sort((a, b) => survivalOf(b.actor, w.env).p - survivalOf(a.actor, w.env).p);
    beam = list.slice(0, BEAM);
    if (!beam.length) break;
  }
  beam.sort((a, b) => survivalOf(b.actor, w.env).p - survivalOf(a.actor, w.env).p);
  return beam[0] ?? { actor: initialActor(talentId), choices: [] };
}

/** 为本局算出事后最优曲线。三个天赋都试，取最好的那条。 */
export function oracleFor(w: World): Session["oracle"] {
  let best: Node | null = null;
  let bestTalent: string | null = null;
  for (const t of w.talentChoices) {
    const node = runTalent(w, t);
    if (!best || survivalOf(node.actor, w.env).p > survivalOf(best.actor, w.env).p) {
      best = node;
      bestTalent = t;
    }
  }
  const start = survivalFrom(0, 0, 1, 0, w.env).p;
  const actor = best?.actor;
  return {
    talent: bestTalent,
    survival: [start, ...(actor?.answers.map((a) => a.survival) ?? [])],
    energy: [FULL_ENERGY, ...(actor?.answers.map((a) => a.energyAfter) ?? [])],
  };
}

/** 一局结束时才把参考线挂上去，避免中间过程反复计算。 */
export function attachOracle(s: Session): Session {
  if (s.oracle.survival.length > 1) return s;
  return { ...s, oracle: oracleFor(s.world) };
}
