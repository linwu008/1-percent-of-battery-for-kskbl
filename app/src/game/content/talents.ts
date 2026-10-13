import type { Talent } from "../types";

/** 12种行动策略，每局随机抽3种供玩家三选一；内部ID和效果保持兼容。 */
export const TALENTS: Talent[] = [
  {
    id: "dim",
    name: "降低亮度",
    note: "亮屏类操作耗电减少三成。",
    discount: { tags: ["screen"], rate: 0.3 },
  },
  {
    id: "steady",
    name: "短光示位",
    note: "光信号类操作耗电减少三成。",
    discount: { tags: ["light"], rate: 0.3 },
  },
  {
    id: "bearing",
    name: "多源定位",
    note: "与位置相关的成果，每次多得 1 点。",
    boost: { outcomes: ["position"], points: 1 },
  },
  {
    id: "voice",
    name: "口头传达",
    note: "口述与呼喊类成果，每次多得 1 点。",
    boost: { outcomes: ["brief"], points: 1 },
  },
  {
    id: "coldproof",
    name: "设备保温",
    note: "严寒环境下，所有操作耗电减两成。",
    shield: { key: "temp", in: ["freezing"], rate: 0.2 },
  },
  {
    id: "calm",
    name: "稳定操作",
    note: "疑似骨折或持续失血时，所有操作耗电减两成。",
    shield: { key: "injury", in: ["fracture", "bleeding"], rate: 0.2 },
  },
  {
    id: "scribe",
    name: "离线记录",
    note: "纸笔记录类操作耗电减半。",
    discount: { tags: ["paper"], rate: 0.5 },
  },
  {
    id: "legs",
    name: "缩短行动",
    note: "移动类操作耗电减三成。",
    discount: { tags: ["move"], rate: 0.3 },
  },
  {
    id: "crowd",
    name: "分工互助",
    note: "与同行者相关的成果，每次多得 1 点。",
    boost: { outcomes: ["people", "relay"], points: 1 },
  },
  {
    id: "listener",
    name: "交叉确认",
    note: "与回联确认相关的成果，每次多得 1 点。",
    boost: { outcomes: ["ack"], points: 1 },
  },
  {
    id: "frugal",
    name: "低耗操作",
    note: "亮屏、光信号、口述、纸笔、移动、导航和医疗类操作耗电减少一成。",
    discount: {
      tags: ["screen", "light", "voice", "paper", "move", "nav", "medical"],
      rate: 0.1,
    },
  },
  {
    id: "patient",
    name: "间歇待机",
    note: "等待与观察类行动成本抵扣0.015%，最低为0；不会回电，自然损耗照计。",
    refund: { tags: ["wait"], amount: 15 },
  },
];

export const TALENT_BY_ID: Record<string, Talent> = Object.fromEntries(
  TALENTS.map((t) => [t.id, t]),
);
