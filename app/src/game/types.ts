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

export type Disaster =
  | "earthquake"
  | "flood"
  | "fire"
  | "mudslide"
  | "typhoon"
  | "avalanche";
export type Network = "flicker" | "weak" | "dead" | "local";
export type Injury = "none" | "scratch" | "fracture" | "bleeding";
export type Temp = "freezing" | "cool" | "sultry";
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
  /** 电量成本，单位 0.001%。 */
  cost: number;
  tags: Tag[];
  gain?: Gain;
  gamble?: Gamble;
  env?: EnvRule[];
  /** 只有环境匹配时才出现；不满足则该选项不列出。 */
  onlyIf?: { key: keyof Env; in: string[] };
}

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
  version: string;
}

export interface AnswerLog {
  questionId: string;
  optionIndex: number;
  label: string;
  cost: number;
  /** 实际生效的收益（含环境修正、赌运结果） */
  gained: Gain[];
  gambled: { outcome: OutcomeId; points: number; won: boolean }[];
  note: string;
  energyAfter: number;
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
  schema: 2;
  id: string;
  world: World;
  ghostPersona: string;
  practice: boolean;
  player: Actor;
  ghost: Actor;
  /** 玩家已作答数量；Ghost 只同步到这里 */
  step: number;
  ending: string | null;
}

/** 本地成长记录：只记玩过哪些种子、拿过的最高分，不记行为画像。 */
export interface Profile {
  schema: 2;
  completed: string[];
  best: number;
}
