import { describe, it, expect } from "vitest";
import { CATALOG, CATEGORIES } from "./catalog";
import { TALENTS } from "../game/content/talents";
import { PERSONAS } from "../game/content/personas";
import { FULL_ENERGY } from "../game/config";

describe("玩家变量目录", () => {
  it("覆盖全部策略和Ghost，ID唯一", () => {
    expect(
      CATALOG.filter((e) => e.category === "strategy").map((e) => e.id),
    ).toEqual(TALENTS.map((t) => `strategy-${t.id}`));
    expect(
      CATALOG.filter((e) => e.category === "ghost").map((e) => e.id),
    ).toEqual(PERSONAS.map((p) => `ghost-${p.id}`));
    expect(new Set(CATALOG.map((e) => e.id)).size).toBe(CATALOG.length);
    expect(CATEGORIES).toHaveLength(5);
  });
  it("覆盖六个环境轴的全部25种取值", () => {
    expect(CATALOG.filter((e) => e.category === "environment")).toHaveLength(
      25,
    );
  });
  it("明确预算和成本作用，不泄露隐藏评分倍率或未来结果", () => {
    const energy = CATALOG.find((e) => e.id === "energy")!;
    expect(JSON.stringify(energy)).toContain((FULL_ENERGY / 1000).toFixed(3));
    const text = JSON.stringify(CATALOG);
    expect(text).not.toMatch(
      /最重要\s*×|较重要\s*×|critical|questionWeights|foundFull/,
    );
    expect(text).toContain("不会回电");
    expect(text).toContain("自然损耗");
  });
  it("每条数据都有解释、参数和实际例子", () => {
    for (const e of CATALOG) {
      expect(e.name.length).toBeGreaterThan(0);
      expect(e.summary.length).toBeGreaterThan(0);
      expect(e.facts.length).toBeGreaterThan(0);
      expect(e.examples.length).toBeGreaterThan(0);
    }
  });
});
