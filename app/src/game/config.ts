export const RULE_VERSION = "0.2.0";

/** 电量内部以 0.001% 记账。满值 1000 即屏幕上的 1.000%。 */
export const FULL_ENERGY = 1000;

/** 一局抽 10 道题，按阶段配额。 */
export const ROUNDS = 10;
export const STAGE_QUOTA: Record<"early" | "mid" | "late", number> = {
  early: 3,
  mid: 4,
  late: 3,
};

export const OUTCOME_LABELS: Record<string, string> = {
  position: "位置送达",
  people: "人数送达",
  light: "光信号起作用",
  brief: "安排已传达",
  ack: "回联确认",
  relay: "接力送达",
};

/**
 * 拿到一个成果需要累到多少点。点数由题目选项给出。
 * 门槛刻意高于「一次免费操作能拿到的点数」——
 * 否则玩家可以全靠不耗电的口头/敲击选项凑齐成果，1% 电量就形同虚设。
 */
export const OUTCOME_THRESHOLD: Record<string, number> = {
  position: 4,
  people: 2,
  light: 3,
  brief: 2,
  ack: 4,
  relay: 3,
};

/** 成果价值权重。上限 12，而总电量只有 1.000%——全做到物理上不可能。 */
export const OUTCOME_WEIGHTS: Record<string, number> = {
  position: 3,
  people: 1,
  light: 2,
  brief: 1,
  ack: 3,
  relay: 2,
};

export const LABELS = {
  position: "位置送达",
  people: "人数送达",
  ack: "回联确认",
};

export const DISASTER_LABELS: Record<string, string> = {
  earthquake: "地震",
  flood: "洪水",
  fire: "火灾",
  mudslide: "泥石流",
  typhoon: "台风",
  avalanche: "雪崩",
};
export const NETWORK_LABELS: Record<string, string> = {
  flicker: "时断时续",
  weak: "信号微弱",
  dead: "完全中断",
  local: "局部可用",
};
export const INJURY_LABELS: Record<string, string> = {
  none: "暂无伤势",
  scratch: "擦伤",
  fracture: "疑似骨折",
  bleeding: "持续失血",
};
export const TEMP_LABELS: Record<string, string> = {
  freezing: "严寒",
  cool: "阴凉",
  sultry: "闷热",
};
export const DAYLIGHT_LABELS: Record<string, string> = {
  day: "白天",
  dusk: "黄昏",
  night: "深夜",
};
export const CARRY_LABELS: Record<string, string> = {
  none: "两手空空",
  pen: "有纸笔",
  torch: "有手电",
  powerbank: "有残电充电宝",
};

/** 分数：成果优先，余量其次。V=0 时不得分，避免宣传省电胜利。 */
export function scoreOf(value: number, remaining: number): number {
  if (value === 0) return 0;
  return Math.round((11 * value + remaining * 10) * 10) / 10;
}
