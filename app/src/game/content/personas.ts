import type { Persona } from "../types";

/**
 * Ghost 不是最优解，是一种「平常会怎么花这点电」的习惯。
 * 每局随机生成一种，玩家开局看不到，结算时才揭晓——
 * 于是同样的题目，换一个性格就是另一种人生。
 */
export const PERSONAS: Persona[] = [
  {
    id: "hasty",
    name: "急性子",
    note: "看见就办，从不攒着。宁可多开一次机，也不愿多等一秒。",
    w: { cheap: 0.2, gain: 1.4, gamble: 0.6, tags: ["move", "screen"], social: 0.3 },
  },
  {
    id: "miser",
    name: "守财奴",
    note: "每一格电都要掰成两半用。便宜的先上，贵的想都不想。",
    w: { cheap: 2.2, gain: 0.5, gamble: -0.4, tags: ["wait", "paper"], social: 0.1 },
  },
  {
    id: "gambler",
    name: "赌一把",
    note: "专挑没把握的那一个。成了就是赚到，不成也认。",
    w: { cheap: 0.6, gain: 1.0, gamble: 2.2, tags: ["risk"], social: 0.4 },
  },
  {
    id: "caretaker",
    name: "老好人",
    note: "先想着别人。但凡牵涉到身边人的选项，它永远排在前面。",
    w: { cheap: 0.7, gain: 1.0, gamble: 0.3, tags: ["social", "voice"], social: 2.0 },
  },
  {
    id: "planner",
    name: "稳妥派",
    note: "只走看得清结果的路。收益写死的才选，带「不确定」的一律绕开。",
    w: { cheap: 1.0, gain: 1.2, gamble: -1.6, tags: ["paper", "nav"], social: 0.5 },
  },
  {
    id: "leader",
    name: "领头的",
    note: "喜欢让信息落到每个人手里。传达、确认、交代，它一样都不肯省。",
    w: { cheap: 0.8, gain: 1.3, gamble: 0.2, tags: ["voice", "paper", "screen"], social: 1.2 },
  },
];

export const PERSONA_BY_ID: Record<string, Persona> = Object.fromEntries(
  PERSONAS.map((p) => [p.id, p]),
);
