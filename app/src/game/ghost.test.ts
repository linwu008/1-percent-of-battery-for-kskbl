import { describe, it, expect } from "vitest";
import { createWorld } from "./world";
import { act, initialActor } from "./engine";
import {
  ghostAt,
  observe,
  growthOffer,
  acceptGrowth,
  emptyProfile,
} from "./ghost";
import { summarize, compare } from "./scoring";
import { createSession, step, verifyExport } from "./replay";
import type { Actor, World, Action } from "./types";
function wait(w: World, a: Actor, t: number): Actor {
  while (a.time < t) a = act(w, a, { kind: "wait", until: t });
  return a;
}
function path(preset: "A" | "B") {
  const w = createWorld("demo", preset);
  let a = wait(w, initialActor(), 20);
  if (preset === "A")
    a = act(w, a, { kind: "send", items: ["position", "people"] });
  a = wait(w, a, 60);
  a = act(w, a, { kind: "light", duration: 10 });
  a = wait(w, a, 100);
  a = act(w, a, { kind: "brief", method: "paper" });
  a = act(w, a, {
    kind: "send",
    items: preset === "A" ? ["ack"] : ["position"],
  });
  return { w, a: wait(w, a, 160) };
}
describe("Ghost与评分", () => {
  it("case A demonstrates saved resources enable later contact", () => {
    const { w, a } = path("A");
    expect(summarize(a).score).toBe(111);
    expect(summarize(ghostAt(w, 160, 1)).score).toBe(77);
  });
  it("case B rewards timely action instead of hoarding energy", () => {
    const { w, a } = path("B");
    expect(summarize(a).score).toBe(28);
    expect(summarize(ghostAt(w, 160, 1)).score).toBe(99);
  });
  it("Ghost only progresses to player time including unfinished costs", () => {
    const a = ghostAt(createWorld("demo", "A"), 7, 1);
    expect(a.time).toBe(7);
    expect(a.energy).toBe(76);
    expect(a.delivered.position).toBe(false);
    expect(a.logs.every((x) => x.end <= 7)).toBe(true);
  });
  it("zero outcome is zero score with no infinite ratio", () => {
    expect(summarize(initialActor())).toMatchObject({
      score: 0,
      value: 0,
      efficiency: null,
    });
    expect(compare(initialActor(), initialActor()).saving).toBe(null);
  });
  it("different outcomes cannot be reported as same-result savings", () => {
    const { w, a } = path("A");
    expect(compare(a, ghostAt(w, 160, 1)).saving).toBe(null);
  });
  it("growth requires two unique non-practice observations and explicit acceptance", () => {
    const { w, a } = path("A");
    let p = emptyProfile();
    p = observe(p, {
      ...createSession(w, 1, false),
      id: "one",
      player: a,
      ending: "relay",
    });
    expect(growthOffer(p)).toBe(false);
    expect(p.ghostVersion).toBe(1);
    p = observe(p, {
      ...createSession(w, 1, false),
      id: "one",
      player: a,
      ending: "relay",
    });
    expect(p.observations).toHaveLength(1);
    p = observe(p, {
      ...createSession(w, 1, true),
      id: "practice",
      player: a,
      ending: "relay",
    });
    expect(p.observations).toHaveLength(1);
    p = observe(p, {
      ...createSession(w, 1, false),
      id: "two",
      player: a,
      ending: "relay",
    });
    expect(growthOffer(p)).toBe(true);
    expect(p.ghostVersion).toBe(1);
    expect(acceptGrowth(p).ghostVersion).toBe(2);
    expect(ghostAt(w, 80, 2).energy).toBeGreaterThan(ghostAt(w, 80, 1).energy);
  });
});
describe("可复算的记录", () => {
  it("export replays exactly and refuses forged state", () => {
    let s = createSession(createWorld("replay", "A"), 1, false);
    s = step(s, { kind: "send", items: ["position"] });
    expect(verifyExport(JSON.parse(JSON.stringify(s)))).toEqual(s);
    const forged = structuredClone(s);
    forged.player.energy = 100;
    expect(() => verifyExport(forged)).toThrow();
  });
  it("rejects unknown versions, malformed input and future-world edits", () => {
    expect(() => verifyExport(null)).toThrow();
    const s = createSession(createWorld("r", "A"), 1, false);
    expect(() => verifyExport({ ...s, schema: 999 })).toThrow();
    expect(() =>
      verifyExport({ ...s, world: { ...s.world, firstClose: 999 } }),
    ).toThrow();
    expect(() =>
      step(s, { kind: "wait", until: Infinity } as Action),
    ).toThrow();
  });
});
