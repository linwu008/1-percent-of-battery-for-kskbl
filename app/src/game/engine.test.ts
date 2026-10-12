import { describe, expect, it } from "vitest";
import { act, initialActor, choices } from "./engine";
import { createWorld } from "./world";

describe("资源与时间", () => {
  const w = createWorld("test", "A");
  it("single information costs 3 and takes 10 seconds", () => {
    const a = act(w, initialActor(), { kind: "send", items: ["position"] });
    expect([a.time, a.energy, a.delivered.position]).toEqual([10, 70, true]);
  });
  it("batch saves one startup and does not charge waiting", () => {
    const a = act(w, act(w, initialActor(), { kind: "wait", until: 20 }), {
      kind: "send",
      items: ["position", "people"],
    });
    expect([
      a.time,
      a.energy,
      a.delivered.position,
      a.delivered.people,
    ]).toEqual([35, 60, true, true]);
  });
  it("partial transfer charges 3.4 at t32 and keeps completed position", () => {
    const world = { ...w, firstClose: 32 };
    const a = act(
      world,
      act(world, initialActor(), { kind: "wait", until: 20 }),
      { kind: "send", items: ["position", "people"] },
    );
    expect([
      a.time,
      a.energy,
      a.delivered.position,
      a.delivered.people,
    ]).toEqual([32, 66, true, false]);
  });
  it("completion at closing time counts", () => {
    const a = act({ ...w, firstClose: 10 }, initialActor(), {
      kind: "send",
      items: ["position"],
    });
    expect(a.delivered.position).toBe(true);
  });
  it("waiting stops at changed conditions", () => {
    const a = act(createWorld("short", "B"), initialActor(), {
      kind: "wait",
      until: 20,
    });
    expect([a.time, a.energy]).toEqual([15, 100]);
  });
  it("wait cost preview never reveals hidden closing time", () => {
    const a = choices({ ...w, firstClose: 15 }, initialActor()).find(
      (c) => c.action.kind === "wait",
    );
    const b = choices({ ...w, firstClose: 45 }, initialActor()).find(
      (c) => c.action.kind === "wait",
    );
    expect(a?.duration).toBe(20);
    expect(a).toEqual(b);
  });
  it("blocks impossible, duplicate, unknown and unavailable operations", () => {
    expect(() =>
      act(w, initialActor(), { kind: "send", items: ["people"] }),
    ).toThrow();
    const a = act(w, initialActor(), { kind: "send", items: ["position"] });
    expect(() => act(w, a, { kind: "send", items: ["position"] })).toThrow();
    expect(() =>
      act(w, initialActor(), { kind: "wait", until: NaN }),
    ).toThrow();
    expect(() =>
      act(w, initialActor(), { kind: "unknown" } as never),
    ).toThrow();
    expect(() =>
      act(
        w,
        { ...initialActor(), energy: 20 },
        { kind: "send", items: ["position"] },
      ),
    ).toThrow();
  });
  it("light gives partial or full results based on visible conditions", () => {
    const clear = act(
      w,
      { ...initialActor(), time: 60 },
      { kind: "light", duration: 10 },
    );
    const obstructed = act(
      { ...w, visibility: "obstructed" },
      { ...initialActor(), time: 60 },
      { kind: "light", duration: 10 },
    );
    expect([clear.light, obstructed.light, clear.energy]).toEqual([2, 1, 80]);
  });
  it("paper still works without power; screen does not", () => {
    const a = { ...initialActor(), time: 100, energy: 0 };
    expect(act(w, a, { kind: "brief", method: "paper" }).briefed).toBe(true);
    expect(() => act(w, a, { kind: "brief", method: "screen" })).toThrow();
  });
  it("choices lead to a bounded ending", () => {
    let a = initialActor();
    for (let i = 0; i < 20 && a.time < 160; i++) {
      const wait = choices(w, a).find((c) => c.action.kind === "wait");
      expect(wait).toBeDefined();
      a = act(w, a, wait!.action);
    }
    expect(a.time).toBe(160);
  });
  it("same seed and operations always produce same state without mutating inputs", () => {
    expect(createWorld("repro")).toEqual(createWorld("repro"));
    const a = initialActor();
    const before = JSON.stringify(a);
    expect(act(w, a, { kind: "send", items: ["position"] })).toEqual(
      act(w, a, { kind: "send", items: ["position"] }),
    );
    expect(JSON.stringify(a)).toBe(before);
  });
});
