import { RULE_VERSION } from "./config";
import { answer, initialActor, PASS_INDEX, pass } from "./engine";
import { ghostUpTo } from "./ghost";
import { createWorld } from "./world";
import { QUESTION_BY_ID } from "./content/questions";
import { TALENT_BY_ID } from "./content/talents";
import type { Session, World } from "./types";

export function createSession(
  world: World,
  practice = false,
): Session {
  return {
    schema: 4,
    id: crypto.randomUUID(),
    world,
    ghostPersona: world.ghostPersona,
    practice,
    // 天赋还没选，开局由玩家三选一后写入 player.talent
    player: initialActor(null),
    ghost: ghostUpTo(world, 0, world.ghostPersona, world.ghostTalent),
    step: 0,
    // 参考线等一局结束时再算，中间过程不浪费时间
    oracle: { survival: [], energy: [], talent: null },
    ending: null,
  };
}

/** 本局一共几道题：由世界决定，8~12 之间。 */
export function roundsOf(s: Session): number {
  return Math.min(s.world.rounds, s.world.questions.length);
}

export function pickTalent(s: Session, talentId: string): Session {
  if (!s.world.talentChoices.includes(talentId)) throw new Error("本局没有这个天赋");
  if (!TALENT_BY_ID[talentId]) throw new Error("未知天赋");
  if (s.step > 0 || s.player.talent) throw new Error("本局已经选过天赋");
  return { ...s, player: { ...s.player, talent: talentId } };
}

export function step(s: Session, optionIndex: number): Session {
  if (s.ending) throw new Error("本局已结束");
  if (!s.player.talent) throw new Error("还没有选择天赋");
  const questionId = s.world.questions[s.step];
  if (!questionId) throw new Error("本局已答完");
  const q = QUESTION_BY_ID[questionId];
  if (!q) throw new Error("题目不存在");
  const giveUp = optionIndex === PASS_INDEX;
  if (!giveUp && (optionIndex < 0 || optionIndex >= q.options.length))
    throw new Error("选项不存在");
  const player = giveUp
    ? pass(s.world, s.player, questionId)
    : answer(s.world, s.player, questionId, optionIndex);
  const step = s.step + 1;
  const done = step >= roundsOf(s);
  return {
    ...s,
    player,
    // 过程里 Ghost 只同步到「已完成这一题之前」——它此刻的选择玩家看不见。
    // 一局结束时它也要走完最后一步，否则结算页少一条。
    ghost: ghostUpTo(
      s.world,
      done ? roundsOf(s) : step - 1,
      s.ghostPersona,
      s.world.ghostTalent,
    ),
    step,
    ending: done ? "done" : null,
  };
}

export function isDone(s: Session): boolean {
  return s.step >= roundsOf(s);
}

/** 电量见底：把剩下的题一次性空过去，直接进结算。 */
export function finish(s: Session): Session {
  let cur = s;
  let guard = 0;
  while (!isDone(cur) && guard++ <= roundsOf(s) + 1) cur = step(cur, PASS_INDEX);
  return { ...cur, ending: "done" };
}

export function verifyExport(data: unknown): Session {
  if (!data || typeof data !== "object") throw new Error("存档格式无效");
  const s = data as Session;
  if (
    s.schema !== 4 ||
    s.world?.version !== RULE_VERSION ||
    typeof s.id !== "string" ||
    typeof s.practice !== "boolean" ||
    typeof s.step !== "number"
  )
    throw new Error("存档版本或结构不兼容");
  const world = createWorld(s.world.seed, s.world.preset);
  if (JSON.stringify(world) !== JSON.stringify(s.world))
    throw new Error("世界配置与编号不一致");
  let rebuilt: Session = { ...createSession(world, s.practice), id: s.id };
  if (s.player.talent) rebuilt = pickTalent(rebuilt, s.player.talent);
  for (const a of s.player.answers) rebuilt = step(rebuilt, a.optionIndex);
  if (
    rebuilt.player.energy !== s.player.energy ||
    JSON.stringify(rebuilt.player.delivered) !==
      JSON.stringify(s.player.delivered)
  )
    throw new Error("记录校验失败，请新开一局");
  return { ...rebuilt, ending: s.ending };
}
