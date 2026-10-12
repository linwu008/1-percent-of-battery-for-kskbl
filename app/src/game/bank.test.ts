import { describe, expect, it } from "vitest";
import { MAX_ROUNDS, OUTCOME_THRESHOLD } from "./config";
import { QUESTIONS, questionsByStage } from "./content/questions";
import { TALENTS } from "./content/talents";
import type { Env, OutcomeId, Tag } from "./types";

const STAGES = ["early", "mid", "late"] as const;

const TAGS: Tag[] = [
  "screen",
  "light",
  "voice",
  "paper",
  "move",
  "wait",
  "risk",
  "social",
  "nav",
  "medical",
];

/** 每个环境维度的合法取值，与 world.ts 里的抽取池保持一致。 */
const ENV_VALUES = {
  disaster: ["earthquake", "flood", "fire", "mudslide", "typhoon", "avalanche"],
  network: ["flicker", "weak", "dead", "local"],
  injury: ["none", "scratch", "fracture", "bleeding"],
  temp: ["freezing", "cool", "sultry", "hot"],
  daylight: ["day", "dusk", "night"],
  carry: ["none", "pen", "torch", "powerbank"],
} as const satisfies Record<keyof Env, readonly string[]>;

const OUTCOMES = Object.keys(OUTCOME_THRESHOLD) as OutcomeId[];

describe("题库体检", () => {
  it("规模足够大，两局很难撞题", () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(120);
    // 一局最多 12 题、三阶段各占约三成，每个阶段至少要撑得起 12 题的抽题
    for (const s of STAGES)
      expect(questionsByStage(s).length).toBeGreaterThanOrEqual(MAX_ROUNDS * 2);
  });

  it("编号不重复", () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("每题都有至少两条题干变体、三个选项、一个不花钱的选择", () => {
    // 一次性汇总，避免每次只报出第一个坏题
    const bad: string[] = [];
    for (const q of QUESTIONS) {
      if (q.prompt.length < 2) bad.push(`${q.id} 题干变体不足`);
      if (!q.prompt.every((p) => p.length > 8)) bad.push(`${q.id} 题干过短`);
      if (q.options.length < 3) bad.push(`${q.id} 选项不足三个`);
      if (!q.options.some((o) => o.cost === 0)) bad.push(`${q.id} 没有免费选项`);
      if (!q.options.some((o) => o.gain || o.gamble))
        bad.push(`${q.id} 没有任何收益`);
    }
    expect(bad.join(" / ")).toBe("");
  });

  it("选项字段都合法", () => {
    for (const q of QUESTIONS)
      for (const o of q.options) {
        expect(o.label.length, `${q.id}/${o.label}`).toBeGreaterThan(0);
        expect(o.detail.length, `${q.id}/${o.label}`).toBeGreaterThan(0);
        expect(o.cost, `${q.id}/${o.label}`).toBeGreaterThanOrEqual(0);
        expect(o.cost, `${q.id}/${o.label}`).toBeLessThanOrEqual(260);
        expect(o.tags.length, `${q.id}/${o.label}`).toBeGreaterThan(0);
        for (const t of o.tags) expect(TAGS, `${q.id}/${o.label}`).toContain(t);
      }
  });

  it("收益与赌运都指向真实成果，赌率在合理区间", () => {
    for (const q of QUESTIONS)
      for (const o of q.options) {
        if (o.gain) {
          expect(OUTCOMES, `${q.id}/${o.label}`).toContain(o.gain.outcome);
          expect(o.gain.points, `${q.id}/${o.label}`).toBeGreaterThan(0);
        }
        if (o.gamble) {
          expect(OUTCOMES, `${q.id}/${o.label}`).toContain(o.gamble.outcome);
          expect(o.gamble.points, `${q.id}/${o.label}`).toBeGreaterThan(0);
          expect(o.gamble.odds, `${q.id}/${o.label}`).toBeGreaterThan(0.2);
          expect(o.gamble.odds, `${q.id}/${o.label}`).toBeLessThanOrEqual(0.7);
          expect(o.gamble.hint.length, `${q.id}/${o.label}`).toBeGreaterThan(0);
        }
      }
  });

  it("环境修正引用的维度和取值都真实存在", () => {
    for (const q of QUESTIONS)
      for (const o of q.options)
        for (const r of o.env ?? []) {
          const allowed = ENV_VALUES[r.key];
          expect(allowed, `${q.id}/${o.label}/${r.key}`).toBeDefined();
          for (const v of r.in)
            expect(allowed!, `${q.id}/${o.label}/${r.key}/${v}`).toContain(v);
          expect(r.note.length, `${q.id}/${o.label}/${r.key}`).toBeGreaterThan(0);
        }
  });

  it("环境耦合覆盖足够广：多数题目里同一个选项在不同世界值不同的钱", () => {
    const withEnv = QUESTIONS.filter((q) =>
      q.options.some((o) => (o.env ?? []).length > 0),
    );
    expect(withEnv.length).toBeGreaterThanOrEqual(QUESTIONS.length * 0.5);
  });

  it("不确定收益占比适中：既不是全赌也不是全确定", () => {
    const withGamble = QUESTIONS.filter((q) => q.options.some((o) => o.gamble));
    expect(withGamble.length).toBeGreaterThanOrEqual(QUESTIONS.length * 0.25);
    expect(withGamble.length).toBeLessThanOrEqual(QUESTIONS.length * 0.75);
  });

  it("六类成果在题库里都拿得到，否则某些局必然打不通", () => {
    const reachable = new Set<OutcomeId>();
    for (const q of QUESTIONS)
      for (const o of q.options) {
        if (o.gain) reachable.add(o.gain.outcome);
        if (o.gamble) reachable.add(o.gamble.outcome);
      }
    for (const k of OUTCOMES) expect([...reachable], k).toContain(k);
  });

  it("天赋涉及的标签在题库里真的用得上", () => {
    const used = new Set<string>(QUESTIONS.flatMap((q) => q.options.flatMap((o) => o.tags)));
    for (const t of TALENTS) {
      if (t.discount) expect([...used], t.id).toContain(t.discount.tags[0]);
      if (t.refund) expect([...used], t.id).toContain(t.refund.tags[0]);
    }
  });

  it("文案里没有混入英文单词（SIM / SOS 这类通用缩写除外）", () => {
    const allow = ["SIM", "SOS", "GPS"];
    for (const q of QUESTIONS)
      for (const raw of [...q.prompt, ...q.options.map((o) => o.label + o.detail)]) {
        const stripped = raw.replace(/SIM|SOS|GPS/g, "");
        expect(/[A-Za-z]{3,}/.test(stripped), `${q.id}: ${raw}`).toBe(false);
      }
  });
});
