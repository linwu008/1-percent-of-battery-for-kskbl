import { RULE_VERSION, STAGE_QUOTA } from "./config";
import { TALENTS } from "./content/talents";
import { PERSONAS } from "./content/personas";
import { QUESTIONS } from "./content/questions";
import { pick, shuffle } from "./rng";
import type { Env, World } from "./types";

const DISASTERS = ["earthquake", "flood", "fire", "mudslide", "typhoon", "avalanche"] as const;
const NETWORKS = ["flicker", "weak", "dead", "local"] as const;
const INJURIES = ["none", "scratch", "fracture", "bleeding"] as const;
const TEMPS = ["freezing", "cool", "sultry"] as const;
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

function drawQuestions(seed: string): string[] {
  const ids: string[] = [];
  for (const stage of ["early", "mid", "late"] as const) {
    const pool = QUESTIONS.filter((q) => q.stage === stage).map((q) => q.id);
    const take = Math.min(STAGE_QUOTA[stage], pool.length);
    ids.push(...shuffle(seed, `q-${stage}`, pool).slice(0, take));
  }
  return ids;
}

/** 固定案例也按阶段配额取题，这样演示与随机局的结构一致。 */
function presetQuestions(): string[] {
  const ids: string[] = [];
  for (const stage of ["early", "mid", "late"] as const)
    ids.push(
      ...QUESTIONS.filter((q) => q.stage === stage)
        .slice(0, STAGE_QUOTA[stage])
        .map((q) => q.id),
    );
  return ids;
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
  return {
    seed,
    preset,
    env,
    talentChoices: shuffle(seed, "talents", talentIds).slice(0, 3),
    ghostPersona: pick(seed, "persona", PERSONAS.map((p) => p.id)),
    ghostTalent: pick(seed, "gtalent", talentIds),
    // 固定案例的题目顺序也固定，演示与测试才复现得了。
    questions: preset ? presetQuestions() : drawQuestions(seed),
    version: RULE_VERSION,
  };
}

export function envSummary(env: Env): string[] {
  const L = {
    disaster: { earthquake: "地震", flood: "洪水", fire: "火灾", mudslide: "泥石流", typhoon: "台风", avalanche: "雪崩" },
    network: { flicker: "时断时续", weak: "微弱", dead: "完全中断", local: "局部可用" },
    injury: { none: "暂无伤势", scratch: "擦伤", fracture: "疑似骨折", bleeding: "持续失血" },
    temp: { freezing: "严寒", cool: "阴凉", sultry: "闷热" },
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
