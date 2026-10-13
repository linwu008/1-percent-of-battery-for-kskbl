import { describe, expect, it } from "vitest";
import { idleDrain } from "./config";
import { answer, costOf, initialActor, pass, preview } from "./engine";
import { QUESTION_BY_ID } from "./content/questions";
import { ghostUpTo } from "./ghost";
import { survivalOf } from "./scoring";
import { createWorld } from "./world";
import * as timeline from "./timeline";

describe("按世界种子推进的游戏时间", () => {
  it.each([
    ["day", 0, "12:00 p.m."],
    ["dusk", 0, "6:00 p.m."],
    ["night", 0, "8:00 p.m."],
    ["night", 25, "8:25 p.m."],
    ["night", 235, "11:55 p.m."],
    ["night", 240, "次日 12:00 a.m."],
    ["night", 265, "次日 12:25 a.m."],
  ] as const)("%s开局推进%i分钟显示%s", (daylight, minutes, label) => {
    const w = createWorld("clock-label");
    w.env.daylight = daylight;
    expect(timeline.clockLabel(w, minutes)).toBe(label);
  });

  it("重放或刷新后仍使用相同时间表，读取时长不改变世界", () => {
    const world = createWorld("clock-replay");
    const restored = JSON.parse(JSON.stringify(world));
    const schedule = world.questions.map((_, i) => timeline.stepDuration(world, i));
    expect(restored.questions.map((_: string, i: number) => timeline.stepDuration(restored, i))).toEqual(schedule);
    expect(timeline.elapsedMinutes(initialActor())).toBe(0);
    expect(world).toEqual(restored);
  });

  it.each([100, 5])("动作后的可用电量为%i时，预览自然损耗与实际扣除相符", (remaining) => {
    const w = createWorld("clock-preview");
    const q = QUESTION_BY_ID[w.questions[0]];
    const actor = initialActor();
    const cost = costOf(q.options[0], w.env, null);
    actor.energy = cost + remaining;
    const before = preview(w, actor, q, 0);
    const after = answer(w, actor, q.id, 0);
    expect(before.idle).toBe(after.answers[0].idleDrain);
    expect(after.energy).toBe(actor.energy - before.cost - before.idle);
    expect(after.answers[0].minutes).toBe(timeline.stepDuration(w, 0));
  });

  it("每步在25、30、35分钟中取值，累计到日志，双方共享时间表", () => {
    const w = createWorld("clock-steps");
    let player = initialActor();
    let previous = 0;
    const durations: number[] = [];
    for (const id of w.questions) {
      player = pass(w, player, id);
      const minutes = player.answers.at(-1)!.minutes;
      durations.push(minutes - previous);
      previous = minutes;
    }
    expect(durations.every((n) => [25, 30, 35].includes(n))).toBe(true);
    expect(new Set(durations).size).toBeGreaterThan(1);
    const ghost = ghostUpTo(w, w.rounds, w.ghostPersona, w.ghostTalent);
    expect(ghost.answers.map((a) => a.minutes)).toEqual(player.answers.map((a) => a.minutes));
  });

  it("自然损耗按实际分钟数缩放，30分钟保留原来每步的14格预算", () => {
    const env = { ...createWorld("clock-drain").env, temp: "cool", network: "local" } as const;
    expect(idleDrain(env, 30)).toBe(14);
    expect(idleDrain(env, 60)).toBe(28);
    expect(idleDrain(env, 25)).toBe(12);
    expect(idleDrain(env, 35)).toBe(16);
    expect(idleDrain(env, 0)).toBe(0);
  });

  it("存活时间处罚依据累计分钟数，不依据日志条数", () => {
    const w = createWorld("clock-penalty");
    w.env = { ...w.env, temp: "cool", injury: "none" };
    const actor = pass(w, initialActor(), w.questions[0]);
    actor.energy = 200;
    actor.answers[0].minutes = 30;
    const first = survivalOf(actor, w.env).endure;
    actor.answers[0].minutes = 60;
    expect(first - survivalOf(actor, w.env).endure).toBeCloseTo(0.009, 8);
  });
});
