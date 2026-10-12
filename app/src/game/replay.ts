import { act, initialActor } from "./engine";
import { ghostAt } from "./ghost";
import { createWorld } from "./world";
import { RULE_VERSION } from "./config";
import type { World, Action, Session } from "./types";
export function createSession(
  world: World,
  ghostVersion: number,
  practice = false,
): Session {
  return {
    schema: 1,
    id: crypto.randomUUID(),
    world,
    ghostVersion,
    practice,
    player: initialActor(),
    ghost: ghostAt(world, 0, ghostVersion),
    actions: [],
    ending: null,
  };
}
export function step(s: Session, action: Action): Session {
  if (s.ending || s.actions.length >= 80)
    throw new Error("本局已结束或动作数超出限制");
  const player = act(s.world, s.player, action);
  return {
    ...s,
    player,
    ghost: ghostAt(s.world, player.time, s.ghostVersion),
    actions: [...s.actions, structuredClone(action)],
  };
}
export function verifyExport(data: unknown): Session {
  if (!data || typeof data !== "object") throw new Error("存档格式无效");
  const s = data as Session;
  if (
    s.schema !== 1 ||
    s.world?.version !== RULE_VERSION ||
    !Array.isArray(s.actions) ||
    s.actions.length > 80 ||
    typeof s.id !== "string" ||
    s.id.length > 128 ||
    typeof s.practice !== "boolean" ||
    ![1, 2].includes(s.ghostVersion) ||
    ![null, "relay", "check"].includes(s.ending)
  )
    throw new Error("存档版本或结构不兼容");
  if (s.world.preset !== undefined && !["A", "B"].includes(s.world.preset))
    throw new Error("无效案例");
  const world = createWorld(s.world.seed, s.world.preset);
  if (JSON.stringify(world) !== JSON.stringify(s.world))
    throw new Error("世界配置与编号不一致");
  let rebuilt = {
    ...createSession(world, s.ghostVersion, s.practice),
    id: s.id,
  };
  for (const action of s.actions) rebuilt = step(rebuilt, action);
  if (s.ending && rebuilt.player.time !== 160)
    throw new Error("尚未结束的存档不能标记结局");
  if (s.ending === "relay" && !rebuilt.player.briefed)
    throw new Error("未传达安排，无法据此组织同行者");
  rebuilt.ending = s.ending;
  if (
    JSON.stringify(rebuilt.player) !== JSON.stringify(s.player) ||
    JSON.stringify(rebuilt.ghost) !== JSON.stringify(s.ghost)
  )
    throw new Error("记录校验失败，请新开一局");
  return rebuilt;
}
