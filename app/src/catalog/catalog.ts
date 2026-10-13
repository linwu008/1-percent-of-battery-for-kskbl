import {
  CARRY_LABELS,
  COST_NETWORK_SCREEN,
  COST_SCALE,
  COST_TEMP,
  DAYLIGHT_LABELS,
  DISASTER_LABELS,
  FULL_ENERGY,
  IDLE_DRAIN_BASE,
  IDLE_NETWORK,
  IDLE_TEMP,
  INJURY_LABELS,
  NETWORK_LABELS,
  OUTCOME_LABELS,
  OUTCOME_THRESHOLD,
  STEP_MINUTES,
  SURVIVAL,
  TEMP_LABELS,
} from "../game/config";
import { TALENTS } from "../game/content/talents";
import { PERSONAS } from "../game/content/personas";
import { QUESTIONS } from "../game/content/questions";
import { costOf } from "../game/engine";
import type { Env, Tag } from "../game/types";

export const CATEGORIES = [
  { id: "resource", name: "资源与时间", en: "RESOURCES", mark: "01" },
  { id: "environment", name: "环境档案", en: "ENVIRONMENT", mark: "02" },
  { id: "strategy", name: "行动策略", en: "STRATEGIES", mark: "03" },
  { id: "ghost", name: "镜像习惯", en: "GHOST", mark: "04" },
  { id: "outcome", name: "成果与结算", en: "OUTCOMES", mark: "05" },
] as const;
export type Category = (typeof CATEGORIES)[number]["id"];
export interface CatalogEntry {
  id: string;
  category: Category;
  name: string;
  summary: string;
  facts: { label: string; value: string }[];
  examples: string[];
}
const fact = (label: string, value: string | number) => ({
  label,
  value: String(value),
});
const entry = (
  id: string,
  category: Category,
  name: string,
  summary: string,
  facts: CatalogEntry["facts"],
  examples: string[],
): CatalogEntry => ({ id, category, name, summary, facts, examples });
const energy = (v: number) => `${(v / 1000).toFixed(3)}%`;
const tags: Record<Tag, string> = {
  screen: "亮屏",
  light: "光信号",
  voice: "口述",
  paper: "纸笔",
  move: "移动",
  wait: "等待观察",
  risk: "冒险",
  social: "协作",
  nav: "导航",
  medical: "医疗",
};
const baseEnv: Env = {
  disaster: "earthquake",
  network: "local",
  injury: "none",
  temp: "cool",
  daylight: "day",
  carry: "none",
};
const resources = [
  entry(
    "energy",
    "resource",
    "最后的电量",
    "所有行动共用的一份预算。余量与成果一起影响结局，单纯保住电量并不等于更高的存活机会。",
    [
      fact("初始预算", energy(FULL_ENERGY)),
      fact("最小单位", "0.001%"),
      fact("归零以后", "只能选择仍可负担的行动；计算关机影响"),
    ],
    ["花掉 0.100% 后，最后 1% 的预算还剩 90%。这不是手机完整电池的 90%。"],
  ),
  entry(
    "cost",
    "resource",
    "行动耗电",
    `名义成本先乘温度、信号系数和整体耗电倍率 ${COST_SCALE}，再应用策略折扣、条件减耗和定额抵扣，每个阶段按引擎取整。`,
    [
      fact("影响来源", "名义费用 → 环境 → 策略"),
      fact("可选条件", "当前余量足以支付行动成本"),
      fact("最低费用", "0.000%，不会回电"),
    ],
    [
      `阴凉、局部网络下，名义费用0.100%的亮屏操作，实际为${energy(costOf({ label: "示例", detail: "", cost: 100, tags: ["screen"] }, baseEnv, null))}；降低亮度策略后为${energy(costOf({ label: "示例", detail: "", cost: 100, tags: ["screen"] }, baseEnv, "dim"))}。`,
    ],
  ),
  entry(
    "idle",
    "resource",
    "自然损耗",
    "每步结算还会扣除设备自然损耗。行动免费，也不代表这一步完全不掉电。",
    [
      fact("基准", `${energy(IDLE_DRAIN_BASE)} / ${STEP_MINUTES}分钟`),
      fact("影响来源", "温度 × 信号 × 本步时长比例"),
      fact("余量不足", "最多扣到零"),
    ],
    [
      "阴凉且局部可用的网络中，一步30分钟自然损耗为0.014%；策略的行动折扣不减免这部分。",
    ],
  ),
  entry(
    "clock",
    "resource",
    "时间与阶段",
    "每次行动推进游戏钟表；时间增加会影响撑到救援的机会。",
    [
      fact("单步时长", "25 / 30 / 35 分钟"),
      fact("起始钟表", "白天12:00 / 黄昏18:00 / 深夜20:00"),
      fact("阶段", "前期 → 中期 → 后期"),
    ],
    [
      "深夜开局20:00，本步推进35分钟，下一步显示20:35；玩家与Ghost使用相同的步长序列。",
    ],
  ),
  entry(
    "risk",
    "resource",
    "确定成果与风险成果",
    "确定成果直接生效，风险成果按选项概率判定。实际成功的部分才进入结算。",
    [
      fact("共同随机性", "同一局、同一题、同一选项共享结果"),
      fact("环境阻断", "明确失败条件优先，策略不能凭空恢复成果"),
      fact("未来结果", "不在目录预告"),
    ],
    [
      "两人在同一题选择同一个冒险行动，不会因为玩家和Ghost身份不同而得到不同赌运。",
    ],
  ),
  entry(
    "world",
    "resource",
    "世界编号与对局记录",
    "种子决定环境、题目序列、策略候选、镜像习惯、步长和随机结果。记录用于重放与比较。",
    [
      fact("世界编号", "相同规则版本下可复现"),
      fact("玩家与Ghost", "环境相同，各自的电量与成果独立"),
      fact("总步数", "局内不提前展示"),
    ],
    ["结算选择“同一局再试”会回到相同条件；换一个决定，再比较结果。"],
  ),
  entry(
    "tags",
    "resource",
    "行动标签",
    "引擎用标签判断操作属于哪一类，策略与Ghost据此匹配，而不是只看按钮文案。",
    Object.entries(tags).map(([id, name]) => fact(name, id)),
    [
      "亮屏策略作用于带亮屏标签的行动；一个行动可以同时带多个标签，匹配折扣只计算一次。",
    ],
  ),
];
const axes: {
  key: keyof Env;
  label: string;
  values: Record<string, string>;
}[] = [
  { key: "disaster", label: "灾种", values: DISASTER_LABELS },
  { key: "network", label: "网络", values: NETWORK_LABELS },
  { key: "injury", label: "伤势", values: INJURY_LABELS },
  { key: "temp", label: "温度", values: TEMP_LABELS },
  { key: "daylight", label: "时段", values: DAYLIGHT_LABELS },
  { key: "carry", label: "随身", values: CARRY_LABELS },
];
const environments = axes.flatMap((axis) =>
  Object.entries(axis.values).map(([value, name]) => {
    const matches = QUESTIONS.flatMap((q) =>
      q.options.flatMap((o) =>
        (o.env ?? [])
          .filter((r) => r.key === axis.key && r.in.includes(value))
          .map((r) => ({ r, o })),
      ),
    );
    const notes = [
      ...new Set(
        matches.map(
          ({ r, o }) =>
            `${o.label}：${r.note}${r.blocksGain ? "（该条件下成果被阻断）" : `（成果调整${r.points > 0 ? "+" : ""}${r.points}点）`}`,
        ),
      ),
    ];
    const facts = [fact("环境轴", axis.label)];
    if (axis.key === "temp")
      facts.push(
        fact("行动耗电系数", `×${COST_TEMP[value]}`),
        fact("自然损耗系数", `×${IDLE_TEMP[value]}`),
      );
    if (axis.key === "network")
      facts.push(
        fact("亮屏费用系数", `×${COST_NETWORK_SCREEN[value]}`),
        fact("自然损耗系数", `×${IDLE_NETWORK[value]}`),
      );
    if (axis.key === "injury")
      facts.push(
        fact("对局影响", "影响撑到救援；部分策略和行动受伤势条件影响"),
      );
    if (axis.key === "daylight")
      facts.push(
        fact("对局影响", "决定起始钟表，并影响部分信号、观察与行动收益"),
      );
    if (axis.key === "carry")
      facts.push(
        fact("对局影响", "影响匹配条件的行动收益，不直接增加电量预算"),
      );
    if (axis.key === "disaster")
      facts.push(fact("对局影响", "灾情叙事；当前没有单独的全局耗电系数"));
    return entry(
      `${axis.key}-${value}`,
      "environment",
      name,
      `${axis.label}条件为“${name}”时的规则档案。具体收益变化只作用于匹配该条件的行动。`,
      facts,
      notes.length
        ? notes
        : [
            axis.key === "disaster"
              ? "灾种不同会改变开局描述；不能仅凭灾种判断某个按钮一定更划算。"
              : "该状态不提供通用成果奖励；请结合行动描述和其他环境条件判断。",
          ],
    );
  }),
);
const strategies = TALENTS.map((t) => {
  const facts = [fact("作用方式", t.note)];
  const examples: string[] = [];
  if (t.discount) {
    facts.push(
      fact("匹配行动", t.discount.tags.map((tag) => tags[tag]).join(" / ")),
    );
    const tag = t.discount.tags[0];
    examples.push(
      `阴凉、局部网络、名义费用0.100%的${tags[tag]}行动：无策略${energy(costOf({ label: "", detail: "", cost: 100, tags: [tag] }, baseEnv, null))} → 本策略${energy(costOf({ label: "", detail: "", cost: 100, tags: [tag] }, baseEnv, t.id))}。`,
    );
  }
  if (t.shield) {
    facts.push(
      fact(
        "触发条件",
        t.shield.in
          .map((v) => axes.find((a) => a.key === t.shield!.key)!.values[v])
          .join(" / "),
      ),
    );
    examples.push(
      "只有环境符合条件才减少行动耗电，策略本身不改变伤势、温度或自然损耗。",
    );
  }
  if (t.boost) {
    facts.push(
      fact(
        "成果范围",
        t.boost.outcomes.map((o) => OUTCOME_LABELS[o]).join(" / "),
      ),
    );
    examples.push(
      `匹配成果实际生效时增加${t.boost.points}点；环境已阻断该行动时不会获得加点，风险成果仍须成功才计入。`,
    );
  }
  if (t.refund) {
    facts.push(
      fact("匹配行动", t.refund.tags.map((tag) => tags[tag]).join(" / ")),
    );
    examples.push(
      `先算环境与策略修正后的行动费用，再抵扣${energy(t.refund.amount)}，最低为零；不会回电，自然损耗照计。`,
    );
  }
  return entry(`strategy-${t.id}`, "strategy", t.name, t.note, facts, examples);
});
const ghosts = PERSONAS.map((p) =>
  entry(
    `ghost-${p.id}`,
    "ghost",
    p.name,
    p.note,
    [
      fact("偏好行动", p.w.tags.map((t) => tags[t]).join(" / ")),
      fact("运行方式", "在能负担的选项中按习惯打分选择"),
      fact("定位", "预设习惯模板，不是最优解或已学习的人格"),
    ],
    [
      "它与你拥有相同起始预算、环境和赌运，但策略与习惯可能不同。比较最终成果和消耗，不能只看谁剩电更多。",
    ],
  ),
);
const outcomes = Object.entries(OUTCOME_LABELS).map(([id, name]) =>
  entry(
    `outcome-${id}`,
    "outcome",
    name,
    "该类成果随实际生效的行动累计；达到门槛时标记为已完成。",
    [
      fact("完成门槛", `${OUTCOME_THRESHOLD[id]}点`),
      fact(
        "影响阶段",
        (SURVIVAL.foundOutcomes as readonly string[]).includes(id)
          ? "被发现的机会"
          : "被救出的机会",
      ),
      fact("部分成果", "已实际生效的点数仍参与概率计算"),
    ],
    [
      "完成标记与加权贡献是两种口径。最终存活概率依据逐步实际点数计算，具体权重及代入过程在结算揭晓。",
    ],
  ),
);
outcomes.push(
  entry(
    "probability",
    "outcome",
    "最终模拟存活概率",
    "被发现、被救出、撑到救援三段机会相乘，得到本局模拟概率。",
    [
      fact("贡献来源", "实际成果、两层权重"),
      fact("坚持条件", "余量、累计时间、伤势、温度、是否关机"),
      fact("参数性质", "游戏模拟值，非现实救援预测"),
    ],
    [
      "节省电量能保护余量，但错失关键成果也可能降低整体概率。具体倍率与本局计算在结束后公开。",
    ],
  ),
);
outcomes.push(
  entry(
    "comparison",
    "outcome",
    "对照、历史与参考线",
    "结算同时展示你的结果、Ghost结果、相对差距和事后搜索参考。",
    [
      fact("相对差距", "玩家概率减Ghost概率，单位为百分点"),
      fact("历史最高", "跨版本记录，不参与本局计算"),
      fact("事后参考", "有限宽度搜索的近似参考，不是已证明的全局最优"),
    ],
    [
      "玩家40%、Ghost30%，差距为高10个百分点。事后参考可以回看整局条件，不能当作Ghost应有的能力。",
    ],
  ),
);
export const CATALOG: CatalogEntry[] = [
  ...resources,
  ...environments,
  ...strategies,
  ...ghosts,
  ...outcomes,
];
