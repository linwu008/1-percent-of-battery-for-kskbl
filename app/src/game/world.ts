import {
  MAX_ROUNDS,
  MIN_ROUNDS,
  QUESTION_WEIGHT_MIX,
  RULE_VERSION,
} from "./config";
import { TALENTS } from "./content/talents";
import { PERSONAS } from "./content/personas";
import { QUESTIONS } from "./content/questions";
import { pick, shuffle } from "./rng";
import type { Env, QuestionWeights, WeightTier, World } from "./types";

const DISASTERS = ["earthquake", "flood", "fire", "mudslide", "typhoon", "avalanche"] as const;
const NETWORKS = ["flicker", "weak", "dead", "local"] as const;
const INJURIES = ["none", "scratch", "fracture", "bleeding"] as const;
const TEMPS = ["freezing", "cool", "sultry", "hot"] as const;
const DAYLIGHTS = ["day", "dusk", "night"] as const;
const CARRIES = ["none", "pen", "torch", "powerbank"] as const;

/** 两个固定案例，用于演示时复现，也用于回归测试。 */
const PRESET_ENV: Record<"A" | "B", Env> = {
  A: {
    disaster: "earthquake",
    network: "local",
    injury: "scratch",
    temp: "cool",
    daylight: "night",
    carry: "pen",
  },
  B: {
    disaster: "earthquake",
    network: "dead",
    injury: "bleeding",
    temp: "freezing",
    daylight: "day",
    carry: "none",
  },
};

/** 固定案例的题数也固定，演示才对得上。 */
const PRESET_ROUNDS: Record<"A" | "B", number> = { A: 9, B: 11 };

/** 按阶段分配题数：早、晚各约三成，剩下的给中期。 */
function quota(rounds: number): Record<"early" | "mid" | "late", number> {
  const early = Math.max(2, Math.round(rounds * 0.3));
  const late = Math.max(2, Math.round(rounds * 0.3));
  return { early, late, mid: Math.max(2, rounds - early - late) };
}

function drawQuestions(seed: string, rounds: number): string[] {
  const ids: string[] = [];
  const q = quota(rounds);
  for (const stage of ["early", "mid", "late"] as const) {
    const pool = QUESTIONS.filter((x) => x.stage === stage).map((x) => x.id);
    const take = Math.min(q[stage], pool.length);
    ids.push(...shuffle(seed, `q-${stage}`, pool).slice(0, take));
  }
  return ids;
}

/** 固定案例也按阶段配额取题，这样演示与随机局的结构一致。 */
function presetQuestions(rounds: number): string[] {
  const ids: string[] = [];
  const q = quota(rounds);
  for (const stage of ["early", "mid", "late"] as const)
    ids.push(
      ...QUESTIONS.filter((x) => x.stage === stage)
        .slice(0, q[stage])
        .map((x) => x.id),
    );
  return ids;
}

/**
 * 给本局的每道题抽一个权重档位。
 * 同一道题在这一局是关键题，在下一局可能只是铺垫——这是肉鸽的随机性来源之一。
 * 配额按 QUESTION_WEIGHT_MIX，但至少保证有一道关键题，否则这一局没有真正的赌注。
 */
export function drawWeights(seed: string, ids: string[]): QuestionWeights {
  const n = ids.length;
  if (n === 0) return {};
  let critical = Math.max(1, Math.round(n * QUESTION_WEIGHT_MIX.critical));
  let important = Math.round(n * QUESTION_WEIGHT_MIX.important);
  if (critical + important > n) {
    important = n - critical;
    if (important < 0) {
      critical = n;
      important = 0;
    }
  }
  const minor = Math.max(0, n - critical - important);
  const bag: WeightTier[] = [
    ...Array<WeightTier>(critical).fill("critical"),
    ...Array<WeightTier>(important).fill("important"),
    ...Array<WeightTier>(minor).fill("minor"),
  ];
  const order = shuffle(seed, "qweight", bag);
  return Object.fromEntries(ids.map((id, i) => [id, order[i] ?? "minor"]));
}

export function createWorld(seed: string, preset?: "A" | "B"): World {
  if (!seed || seed.length > 128) throw new Error("无效的世界编号");
  const env: Env = preset
    ? { ...PRESET_ENV[preset] }
    : {
        disaster: pick(seed, "disaster", DISASTERS),
        network: pick(seed, "network", NETWORKS),
        injury: pick(seed, "injury", INJURIES),
        temp: pick(seed, "temp", TEMPS),
        daylight: pick(seed, "daylight", DAYLIGHTS),
        carry: pick(seed, "carry", CARRIES),
      };
  const talentIds = TALENTS.map((t) => t.id);
  const rounds = preset
    ? PRESET_ROUNDS[preset]
    : MIN_ROUNDS + Math.floor(hash01(seed, "rounds") * (MAX_ROUNDS - MIN_ROUNDS + 1));
  // 固定案例的题目顺序也固定，演示与测试才复现得了。
  const questions = preset ? presetQuestions(rounds) : drawQuestions(seed, rounds);
  return {
    seed,
    preset,
    env,
    talentChoices: shuffle(seed, "talents", talentIds).slice(0, 3),
    ghostPersona: pick(seed, "persona", PERSONAS.map((p) => p.id)),
    ghostTalent: pick(seed, "gtalent", talentIds),
    questions,
    questionWeights: drawWeights(seed, questions),
    rounds,
    version: RULE_VERSION,
  };
}

/** 0~1 之间的确定性小数，用来抽题数。 */
function hash01(seed: string, stream: string): number {
  let h = 2166136261;
  const s = `${seed}|${stream}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  return ((h >>> 0) % 10000) / 10000;
}

export function envSummary(env: Env): string[] {
  const L = {
    disaster: { earthquake: "地震", flood: "洪水", fire: "火灾", mudslide: "泥石流", typhoon: "台风", avalanche: "雪崩" },
    network: { flicker: "时断时续", weak: "微弱", dead: "完全中断", local: "局部可用" },
    injury: { none: "暂无伤势", scratch: "擦伤", fracture: "疑似骨折", bleeding: "持续失血" },
    temp: { freezing: "严寒", cool: "阴凉", sultry: "闷热", hot: "炎热" },
    daylight: { day: "白天", dusk: "黄昏", night: "深夜" },
    carry: { none: "两手空空", pen: "有纸笔", torch: "有手电", powerbank: "有残电充电宝" },
  } as Record<string, Record<string, string>>;
  return [
    `灾种 ${L.disaster[env.disaster]}`,
    `信号 ${L.network[env.network]}`,
    `伤势 ${L.injury[env.injury]}`,
    `温度 ${L.temp[env.temp]}`,
    `时段 ${L.daylight[env.daylight]}`,
    `随身 ${L.carry[env.carry]}`,
  ];
}
