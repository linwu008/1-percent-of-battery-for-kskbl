import { act, choices, initialActor } from "./engine";
import { createWorld } from "./world";
import type { Actor, Action, World, Profile, Session } from "./types";
export function ghostAt(w: World, seconds: number, version: number): Actor {
  if (
    ![1, 2].includes(version) ||
    !Number.isInteger(seconds) ||
    seconds < 0 ||
    seconds > 160
  )
    throw new Error("无效Ghost版本或时间");
  let a = initialActor();
  while (a.time < seconds) {
    const options = choices(w, a).filter((c) => !c.disabled);
    let action: Action | undefined;
    const send = (item: string) =>
      options.find(
        (c) =>
          c.action.kind === "send" &&
          c.action.items.length === 1 &&
          c.action.items[0] === item,
      )?.action;
    if (a.time < 60 || a.time >= 110)
      action = send("ack") ?? send("position") ?? send("people");
    if (!action && a.time >= 60 && a.time < 80) {
      const duration = version === 2 && w.visibility === "clear" ? 10 : 20;
      action =
        options.find(
          (c) => c.action.kind === "light" && c.action.duration === duration,
        )?.action ?? options.find((c) => c.action.kind === "light")?.action;
    }
    if (!action && a.time >= 100)
      action =
        options.find(
          (c) => c.action.kind === "brief" && c.action.method === "screen",
        )?.action ?? options.find((c) => c.action.kind === "brief")?.action;
    action ??= options.find((c) => c.action.kind === "wait")?.action;
    if (!action) throw new Error("Ghost没有可推进动作");
    a = act(w, a, action, seconds);
  }
  return a;
}
export function emptyProfile(): Profile {
  return { schema: 1, ghostVersion: 1, completed: [], observations: [] };
}
export function observe(p: Profile, s: Session): Profile {
  if (
    s.practice ||
    !s.ending ||
    s.player.time !== 160 ||
    p.completed.includes(s.id)
  )
    return p;
  const next = structuredClone(p);
  next.completed.push(s.id);
  const short = s.player.logs.some(
    (l) =>
      l.action.kind === "light" &&
      l.action.duration === 10 &&
      l.cost === 20 &&
      l.gained.includes("光信号确认区域"),
  );
  if (s.world.visibility === "clear" && short && s.ghostVersion === 1)
    next.observations.push(s.id);
  return next;
}
export function growthOffer(p: Profile): boolean {
  if (p.ghostVersion !== 1 || p.observations.length < 2) return false;
  let saved = 0;
  for (const firstClose of [15, 32, 45])
    for (const visibility of ["clear", "obstructed"] as const) {
      const w = { ...createWorld("growth", "A"), firstClose, visibility };
      const a = { ...initialActor(), time: 60, energy: 30 };
      const old = act(w, a, { kind: "light", duration: 20 });
      const candidate = act(w, a, {
        kind: "light",
        duration: visibility === "clear" ? 10 : 20,
      });
      if (candidate.light < old.light) return false;
      saved += candidate.energy - old.energy;
    }
  return saved > 0;
}
export function acceptGrowth(p: Profile): Profile {
  if (!growthOffer(p)) return p;
  return { ...p, ghostVersion: 2 };
}
