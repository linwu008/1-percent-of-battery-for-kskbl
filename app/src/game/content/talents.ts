import type { Talent } from "../types";

/** 12 个天赋，每局随机抽 3 个供玩家三选一。 */
export const TALENTS: Talent[] = [
  {
    id: "dim",
    name: "调暗的手",
    note: "亮屏类操作耗电减少三成。",
    discount: { tags: ["screen"], rate: 0.3 },
  },
  {
    id: "steady",
    name: "手很稳",
    note: "光信号类操作耗电减少三成。",
    discount: { tags: ["light"], rate: 0.3 },
  },
  {
    id: "bearing",
    name: "方向感",
    note: "与位置相关的成果，每次多得 1 点。",
    boost: { outcomes: ["position"], points: 1 },
  },
  {
    id: "voice",
    name: "嗓门大",
    note: "口述与呼喊类成果，每次多得 1 点。",
    boost: { outcomes: ["brief"], points: 1 },
  },
  {
    id: "coldproof",
    name: "耐寒",
    note: "严寒环境下，所有操作耗电减两成。",
    shield: { key: "temp", in: ["freezing"], rate: 0.2 },
  },
  {
    id: "calm",
    name: "镇定",
    note: "有伤势时，所有操作耗电减两成。",
    shield: { key: "injury", in: ["fracture", "bleeding"], rate: 0.2 },
  },
  {
    id: "scribe",
    name: "记得住",
    note: "纸笔记录类操作耗电减半。",
    discount: { tags: ["paper"], rate: 0.5 },
  },
  {
    id: "legs",
    name: "脚程好",
    note: "移动类操作耗电减三成。",
    discount: { tags: ["move"], rate: 0.3 },
  },
  {
    id: "crowd",
    name: "会来事",
    note: "与同行者相关的成果，每次多得 1 点。",
    boost: { outcomes: ["people", "relay"], points: 1 },
  },
  {
    id: "listener",
    name: "耳朵尖",
    note: "与回联确认相关的成果，每次多得 1 点。",
    boost: { outcomes: ["ack"], points: 1 },
  },
  {
    id: "frugal",
    name: "过日子",
    note: "所有操作耗电减少一成，但成果不再有任何加成。",
    discount: {
      tags: ["screen", "light", "voice", "paper", "move", "nav", "medical"],
      rate: 0.1,
    },
  },
  {
    id: "patient",
    name: "沉得住气",
    note: "等待与观察类选项不但不耗电，还回 0.015%。",
    refund: { tags: ["wait"], amount: 15 },
  },
];

export const TALENT_BY_ID: Record<string, Talent> = Object.fromEntries(
  TALENTS.map((t) => [t.id, t]),
);
