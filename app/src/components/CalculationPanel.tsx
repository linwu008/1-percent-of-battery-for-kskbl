import { useState } from "react";
import {
  FULL_ENERGY,
  OUTCOME_LABELS,
  QUESTION_WEIGHT,
  STEP_MINUTES,
  SURVIVAL,
  TIER_WEIGHT,
} from "../game/config";
import { contributions, survivalOf } from "../game/scoring";
import { elapsedMinutes } from "../game/timeline";
import type { Session } from "../game/types";

const num = (n: number) => Number(n.toFixed(6)).toString();
const percent = (n: number) => `${(n * 100).toFixed(2)}%`;
export default function CalculationPanel({ session }: { session: Session }) {
  const [who, setWho] = useState<"player" | "ghost">("player");
  const actor = session[who],
    env = session.world.env,
    c = contributions(actor),
    p = survivalOf(actor, env);
  const remaining = actor.energy / FULL_ENERGY;
  const steps = elapsedMinutes(actor) / STEP_MINUTES;
  const blackout = remaining <= 0.0005 ? SURVIVAL.blackoutPenalty : 0;
  return (
    <section className="calculation-panel panel" aria-label="本局概率计算过程">
      <div className="calculation-heading">
        <div>
          <span className="eyebrow">CALCULATION / 结果从哪里来</span>
          <h2>每一步，算给你看。</h2>
        </div>
        <div className="calculation-tabs" aria-label="选择计算对象">
          <button
            aria-pressed={who === "player"}
            onClick={() => setWho("player")}
          >
            你的计算
          </button>
          <button
            aria-pressed={who === "ghost"}
            onClick={() => setWho("ghost")}
          >
            Ghost 的计算
          </button>
        </div>
      </div>
      <p>
        实际成果乘以两层权重，分别累加到“被发现”和“被救出”；再结合余量与处境，计算“撑到救援”。
      </p>
      <div className="calculation-result" data-testid="calculated-result">
        <span>最终模拟存活概率</span>
        <strong>
          {percent(p.found)} × {percent(p.rescue)} × {percent(p.endure)} ={" "}
          <b>{percent(p.p)}</b>
        </strong>
      </div>
      <div className="calculation-equations">
        <div>
          <span>01 / 被发现</span>
          <p>
            {SURVIVAL.foundBase} + {SURVIVAL.foundSpan} × ({num(c.found)} ÷{" "}
            {SURVIVAL.foundFull}) ={" "}
            {num(
              SURVIVAL.foundBase +
                (SURVIVAL.foundSpan * c.found) / SURVIVAL.foundFull,
            )}
          </p>
          <b>限制在 0～0.95 → {percent(p.found)}</b>
        </div>
        <div>
          <span>02 / 被救出</span>
          <p>
            {SURVIVAL.rescueBase} + {SURVIVAL.rescueSpan} × ({num(c.rescue)} ÷{" "}
            {SURVIVAL.rescueFull}) ={" "}
            {num(
              SURVIVAL.rescueBase +
                (SURVIVAL.rescueSpan * c.rescue) / SURVIVAL.rescueFull,
            )}
          </p>
          <b>限制在 0～0.95 → {percent(p.rescue)}</b>
        </div>
        <div>
          <span>03 / 撑到救援</span>
          <p>
            {SURVIVAL.endureBase} + {SURVIVAL.endureSpan} × {num(remaining)} −{" "}
            {SURVIVAL.timeStepPenalty} × ({elapsedMinutes(actor)} ÷{" "}
            {STEP_MINUTES}) − {SURVIVAL.injuryPenalty[env.injury]} −{" "}
            {SURVIVAL.tempPenalty[env.temp]} − {blackout} ={" "}
            {num(
              SURVIVAL.endureBase +
                SURVIVAL.endureSpan * remaining -
                SURVIVAL.timeStepPenalty * steps -
                SURVIVAL.injuryPenalty[env.injury] -
                SURVIVAL.tempPenalty[env.temp] -
                blackout,
            )}
          </p>
          <b>限制在 0.03～0.95 → {percent(p.endure)}</b>
          <small>
            依次代入：剩余预算比例、累计分钟、伤势、温度、关机惩罚。
          </small>
        </div>
      </div>
      <details className="calculation-steps">
        <summary>
          逐步展开：点数怎样变成贡献 <span>{actor.answers.length} 步</span>
        </summary>
        <div className="calculation-table-scroll">
          <table>
            <thead>
              <tr>
                <th>步骤与行动</th>
                <th>实际生效成果</th>
                <th>点数 × 动作 × 题目</th>
                <th>计入</th>
              </tr>
            </thead>
            <tbody>
              {actor.answers.flatMap((l, index) => {
                const gains = [
                  ...l.gained,
                  ...l.gambled
                    .filter((g) => g.won)
                    .map((g) => ({ outcome: g.outcome, points: g.points })),
                ];
                if (!gains.length)
                  return (
                    <tr key={`${index}-empty`}>
                      <td>
                        {index + 1}. {l.label}
                      </td>
                      <td>无实际成果</td>
                      <td>
                        0 × {TIER_WEIGHT[l.tier]} × {QUESTION_WEIGHT[l.qTier]} =
                        0
                      </td>
                      <td>不增加贡献</td>
                    </tr>
                  );
                return gains.map((g, i) => (
                  <tr key={`${index}-${i}`}>
                    <td>
                      {index + 1}. {l.label}
                    </td>
                    <td>
                      {OUTCOME_LABELS[g.outcome]} {num(g.points)} 点
                    </td>
                    <td>
                      {num(g.points)} × {TIER_WEIGHT[l.tier]} ×{" "}
                      {QUESTION_WEIGHT[l.qTier]} ={" "}
                      {num(
                        g.points *
                          TIER_WEIGHT[l.tier] *
                          QUESTION_WEIGHT[l.qTier],
                      )}
                    </td>
                    <td>
                      {(SURVIVAL.foundOutcomes as readonly string[]).includes(
                        g.outcome,
                      )
                        ? "被发现"
                        : "被救出"}
                    </td>
                  </tr>
                ));
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4}>
                  被发现贡献合计 {num(c.found)} · 被救出贡献合计 {num(c.rescue)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </details>
      <p className="calculation-note">
        表中只计算已经生效的点数；未成功的风险成果不计入。界面数字经过四舍五入，最终结果使用未舍入数值计算。以上为游戏模拟概率。
      </p>
    </section>
  );
}
