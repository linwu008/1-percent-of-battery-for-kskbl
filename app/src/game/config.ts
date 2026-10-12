import type { Env, Tag, WeightTier } from "./types";

export const RULE_VERSION = "0.3.0";

/** 电量内部以 0.001% 记账。满值 1000 即屏幕上的 1.000%。 */
export const FULL_ENERGY = 1000;

/** 每一个步骤固定推进 15 分钟。阅读与思考不推进时间。 */
export const STEP_MINUTES = 15;

/** 一局抽 8~12 道题，具体几道是世界的一部分，玩家不知道。 */
export const MIN_ROUNDS = 8;
export const MAX_ROUNDS = 12;

/**
 * 选项名义成本的整体倍率：v0.2.0 的电太耐用，这里整体上调。
 * 1.3 是实测出来的「中等偏狠」：认真打能把电花到见底，但不至于每局都在干瞪眼。
 */
export const COST_SCALE = 1.3;

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

/* ───────────────────────── 权重档位 ───────────────────────── */

export const TIER_WEIGHT: Record<WeightTier, number> = {
  critical: 3,
  important: 2,
  minor: 1,
};

export const TIER_LABELS: Record<WeightTier, string> = {
  critical: "最重要",
  important: "较重要",
  minor: "不重要",
};

/**
 * 题库没写档位时按「这个动作花了多少电」推一个：
 * 免费的小动作算「不重要」，掏电的动作越贵分量越重。
 * 关键是没有收益的一律落到「不重要」——白花力气不该计分。
 */
export function defaultTier(cost: number, hasGain: boolean): WeightTier {
  if (!hasGain) return "minor";
  if (cost <= 0) return "minor";
  return cost >= 110 ? "critical" : "important";
}

/* ───────────────────── 自然损耗与环境耦合 ───────────────────── */

/** 每 15 分钟的基础自然损耗（0.001% 为单位）。不操作也在掉。 */
export const IDLE_DRAIN_BASE = 14;

/** 温度影响电池：炎热与严寒都更费电。 */
export const IDLE_TEMP: Record<string, number> = {
  freezing: 1.3,
  cool: 1.0,
  sultry: 1.15,
  hot: 1.55,
};

/** 信号越差，手机越费劲地搜网，自然损耗越高。 */
export const IDLE_NETWORK: Record<string, number> = {
  flicker: 1.35,
  weak: 1.2,
  dead: 1.45,
  local: 1.0,
};

export function idleDrain(env: Env): number {
  return Math.round(
    IDLE_DRAIN_BASE * (IDLE_TEMP[env.temp] ?? 1) * (IDLE_NETWORK[env.network] ?? 1),
  );
}

/** 同一动作在不同环境下的实际耗电倍率。 */
export const COST_TEMP: Record<string, number> = {
  freezing: 1.15,
  cool: 1.0,
  sultry: 1.1,
  hot: 1.25,
};

/** 断网时亮屏类操作要反复重试，更费电。 */
export const COST_NETWORK_SCREEN: Record<string, number> = {
  flicker: 1.2,
  weak: 1.15,
  dead: 1.3,
  local: 1.0,
};

export function costFactor(env: Env, tags: Tag[]): number {
  let f = COST_SCALE * (COST_TEMP[env.temp] ?? 1);
  if (tags.includes("screen")) f *= COST_NETWORK_SCREEN[env.network] ?? 1;
  return f;
}

/* ───────────────────────── 存活概率 ───────────────────────── */

/**
 * 存活概率 = 被发现 × 被救出 × 撑到救援，三段各自可解释。
 * 前两段看「加权贡献」：每步贡献 = 该成果的点数 × 该选项的档位权重。
 * 第三段看剩余电量、已耗时间、伤势与温度。
 */
export const SURVIVAL = {
  foundOutcomes: ["position", "light", "people"] as const,
  rescueOutcomes: ["brief", "ack", "relay"] as const,
  // 归一化用的满值：由离线标定得出，好打法能接近但很难打满
  foundFull: 15,
  rescueFull: 10,
  foundBase: 0.18,
  foundSpan: 0.85,
  rescueBase: 0.22,
  rescueSpan: 0.78,
  endureBase: 0.66,
  endureSpan: 0.42,
  /** 每多推进 15 分钟，撑到救援的概率掉一点 */
  timeStepPenalty: 0.012,
  injuryPenalty: { none: 0, scratch: 0.02, fracture: 0.08, bleeding: 0.16 },
  tempPenalty: { cool: 0, sultry: 0.02, hot: 0.06, freezing: 0.1 },
  /** 手机彻底关机：最后那点联系能力也没了，这是最狠的一项惩罚 */
  blackoutPenalty: 0.25,
} as const;

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
  hot: "炎热",
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

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** 分数（旧口径，仍保留用于历史记录）：成果优先，余量其次。 */
export function scoreOf(value: number, remaining: number): number {
  if (value === 0) return 0;
  return Math.round((11 * value + remaining * 10) * 10) / 10;
}

export interface SurvivalBreakdown {
  /** 最终存活概率，0~1 */
  p: number;
  found: number;
  rescue: number;
  endure: number;
  /** 两段各自的加权贡献分 */
  sFound: number;
  sRescue: number;
}

/**
 * 三段相乘的存活概率。contrib 是「成果 → 加权贡献分」的映射，
 * 由 scoring.ts 从每一步的选择算出来；steps 是已推进的步数。
 */
export function survivalFrom(
  contribFound: number,
  contribRescue: number,
  remaining: number,
  steps: number,
  env: Env,
): SurvivalBreakdown {
  const found = clamp(
    SURVIVAL.foundBase + SURVIVAL.foundSpan * (contribFound / SURVIVAL.foundFull),
    0,
    0.95,
  );
  const rescue = clamp(
    SURVIVAL.rescueBase + SURVIVAL.rescueSpan * (contribRescue / SURVIVAL.rescueFull),
    0,
    0.95,
  );
  const endure = clamp(
    SURVIVAL.endureBase +
      SURVIVAL.endureSpan * remaining -
      SURVIVAL.timeStepPenalty * steps -
      (SURVIVAL.injuryPenalty[env.injury] ?? 0) -
      (SURVIVAL.tempPenalty[env.temp] ?? 0) -
      // 电量归零，手机彻底关机：最后那点联系能力也没了
      (remaining <= 0.0005 ? SURVIVAL.blackoutPenalty : 0),
    0.03,
    0.95,
  );
  return {
    p: found * rescue * endure,
    found,
    rescue,
    endure,
    sFound: contribFound,
    sRescue: contribRescue,
  };
}
