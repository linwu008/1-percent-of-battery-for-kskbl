export type OutcomeId =
  | "position"
  | "people"
  | "light"
  | "brief"
  | "ack"
  | "relay";

export type Stage = "early" | "mid" | "late";

/** 选项标签：天赋、Ghost 性格都按标签匹配。 */
export type Tag =
  | "screen"
  | "light"
  | "voice"
  | "paper"
  | "move"
  | "wait"
  | "risk"
  | "social"
  | "nav"
  | "medical";

/**
 * 权重档位：对存活概率的贡献倍率不同。
 * 选项有一档（这个动作本身有多重），题目也有一档（这道题在整条救援链上有多关键）。
 * 两者都只在结算之后揭晓——过程中玩家看不到，否则就没有判断，只有算术。
 */
export type WeightTier = "critical" | "important" | "minor";

export type Disaster =
  | "earthquake"
  | "flood"
  | "fire"
  | "mudslide"
  | "typhoon"
  | "avalanche";
export type Network = "flicker" | "weak" | "dead" | "local";
export type Injury = "none" | "scratch" | "fracture" | "bleeding";
export type Temp = "freezing" | "cool" | "sultry" | "hot";
export type Daylight = "day" | "dusk" | "night";
export type Carry = "none" | "pen" | "torch" | "powerbank";

export interface Env {
  disaster: Disaster;
  network: Network;
  injury: Injury;
  temp: Temp;
  daylight: Daylight;
  carry: Carry;
}

export interface Gain {
  outcome: OutcomeId;
  points: number;
}

/** 不确定收益：成败由本局种子预先抽定，玩家与 Ghost 抽到的是同一个结果。 */
export interface Gamble {
  outcome: OutcomeId;
  points: number;
  odds: number;
  hint: string;
}

/** 环境耦合：满足条件时收益变动，因此同一选项在不同局里值不值，答案不一样。 */
export interface EnvRule {
  key: keyof Env;
  in: string[];
  points: number;
  note: string;
}

export interface Option {
  label: string;
  detail: string;
  /** 名义电量成本，单位 0.001%。实际成本还受环境与天赋改写。 */
  cost: number;
  tags: Tag[];
  gain?: Gain;
  gamble?: Gamble;
  env?: EnvRule[];
  /** 只有环境匹配时才出现；不满足则该选项不列出。 */
  onlyIf?: { key: keyof Env; in: string[] };
  /** 权重档位。没写就按成本与是否有收益推一个（见 config.defaultTier）。 */
  weight?: WeightTier;
}

/** 题目权重：这一题在整条救援链上有多关键。由世界种子抽定，过程中不显示。 */
export type QuestionWeights = Record<string, WeightTier>;

export interface Question {
  id: string;
  stage: Stage;
  tags: Tag[];
  /** 同一情境的两三种写法，由种子决定用哪一种。 */
  prompt: string[];
  options: Option[];
}

export interface Talent {
  id: string;
  name: string;
  note: string;
  discount?: { tags: Tag[]; rate: number };
  boost?: { outcomes: OutcomeId[]; points: number };
  shield?: { key: keyof Env; in: string[]; rate: number };
  /** 某些标签的选项不但不耗电，还回一点电。 */
  refund?: { tags: Tag[]; amount: number };
}

export interface Persona {
  id: string;
  name: string;
  note: string;
  /** Ghost 打分权重 */
  w: {
    cheap: number;
    gain: number;
    gamble: number;
    tags: Tag[];
    social: number;
  };
}

export interface World {
  seed: string;
  preset?: "A" | "B";
  env: Env;
  talentChoices: string[];
  ghostPersona: string;
  ghostTalent: string;
  /** 本局抽到的题目顺序 */
  questions: string[];
  /** 每道题的权重档位（题目 id → 档位）。同一道题在不同局里分量不同。 */
  questionWeights: QuestionWeights;
  /** 本局一共有几道题（8~12），属于世界的一部分，界面不直接告诉玩家 */
  rounds: number;
  version: string;
}

export interface AnswerLog {
  questionId: string;
  optionIndex: number;
  label: string;
  /** 这一下动作本身耗掉的电 */
  cost: number;
  /** 这 15 分钟里自然损耗掉的电（不操作也掉） */
  idleDrain: number;
  /** 做完这一步时已经过去多少分钟 */
  minutes: number;
  /** 该选项的权重档位 */
  tier: WeightTier;
  /** 这一道题本身的权重档位 */
  qTier: WeightTier;
  /** 实际生效的收益（含环境修正、赌运结果） */
  gained: Gain[];
  gambled: { outcome: OutcomeId; points: number; won: boolean }[];
  note: string;
  energyAfter: number;
  /** 这一步结束时的存活概率估计（0~1），用于画曲线 */
  survival: number;
}

export interface Actor {
  /** 剩余电量，单位 0.001%，满值 1000 = 1.000% */
  energy: number;
  /** 各成果已累计的点数，达到该成果的门槛才算拿到 */
  points: Record<OutcomeId, number>;
  delivered: Record<OutcomeId, boolean>;
  talent: string | null;
  answers: AnswerLog[];
}

export interface Session {
  schema: 4;
  id: string;
  world: World;
  ghostPersona: string;
  practice: boolean;
  player: Actor;
  ghost: Actor;
  /** 玩家已作答数量；Ghost 只同步到这里 */
  step: number;
  /** 事后最优参考线：每步的最优存活概率与当时电量 */
  oracle: { survival: number[]; energy: number[]; talent: string | null };
  ending: string | null;
}

/** 本地成长记录：只记玩过哪些种子、拿过的最高存活概率，不记行为画像。 */
export interface Profile {
  schema: 4;
  completed: string[];
  best: number;
}
