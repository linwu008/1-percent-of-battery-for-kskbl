import { useEffect } from "react";
import {
  OUTCOME_LABELS,
  OUTCOME_THRESHOLD,
  OUTCOME_WEIGHTS,
  QUESTION_WEIGHT,
  STEP_MINUTES,
  idleDrain,
  SURVIVAL,
  TIER_LABELS,
  TIER_WEIGHT,
} from "../game/config";
import { QUESTION_BY_ID } from "../game/content/questions";
import { PERSONA_BY_ID } from "../game/content/personas";
import { TALENT_BY_ID } from "../game/content/talents";
import {
  compare,
  contributions,
  logContribution,
  outcomes,
  survivalSeries,
} from "../game/scoring";
import { envSummary } from "../game/world";
import SurvivalChart from "./SurvivalChart";
import CalculationPanel from "./CalculationPanel";
import type { OutcomeId, Profile, Session, WeightTier } from "../game/types";

const money = (n: number) => `${(n / 1000).toFixed(3)}%`;
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const IDS = Object.keys(OUTCOME_WEIGHTS) as OutcomeId[];
const TIERS = ["critical", "important", "minor"] as WeightTier[];

export default function ResultsScreen({
  session: s,
  profile,
  onNew,
  onReplay,
  onHome,
}: {
  session: Session;
  profile: Profile;
  onNew: () => void;
  onReplay: () => void;
  onHome: () => void;
}) {
  const env = s.world.env;
  const result = compare(s.player, s.ghost, env);
  const persona = PERSONA_BY_ID[s.ghostPersona];
  const talent = s.player.talent ? TALENT_BY_ID[s.player.talent] : null;
  const ghostTalent = TALENT_BY_ID[s.world.ghostTalent];
  const oracleTalent = s.oracle.talent ? TALENT_BY_ID[s.oracle.talent] : null;
  const best = Math.max(profile.best, result.ps.p);

  const mine = contributions(s.player);
  const theirs = contributions(s.ghost);
  const playerSeries = survivalSeries(s.player, env);
  const ghostSeries = survivalSeries(s.ghost, env);
  const oracleSeries =
    s.oracle.survival.length > 1 ? s.oracle.survival : playerSeries;

  /** 与最优参考线拉开最多的那一步。 */
  let worst = { step: 0, gap: 0 };
  for (let i = 1; i < Math.min(oracleSeries.length, playerSeries.length); i++) {
    const gap = oracleSeries[i] - playerSeries[i];
    if (gap > worst.gap) worst = { step: i, gap };
  }

  // 结算页一进来就回到顶部：结果在最上面，别让人停在最下面。
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const download = () => {
    const blob = new Blob([JSON.stringify(s, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `1pct-${s.world.seed}-${s.id.slice(0, 8)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <main className="results-screen">
      <div className="debrief-banner"><span>SIMULATION COMPLETE</span><span>本局记录已生成 / {s.world.seed}</span></div>
      <div className="result-top">
        <div>
          <span className="eyebrow">DEBRIEF / 最后的百分之一</span>
          <h1>
            {result.label}
            <span className="result-star">✳</span>
          </h1>
          <p className="muted">
            {result.delta > 0
              ? "你把同样这一点余量，换成了更高的活下来的可能。"
              : result.delta < 0
                ? "留住电量，不一定留住机会。这次差距，有迹可循。"
                : "相同的起点，留下了接近的结果。下一次，换一种花法试试。"}
          </p>
        </div>
        <dl className="result-summary">
          <div><dt>相对 Ghost 存活概率</dt><dd>{result.delta > 0 ? '高 ' : result.delta < 0 ? '低 ' : '持平 '}
            <b>{Math.abs(result.delta).toFixed(1)}</b><span> 个百分点</span></dd></div>
          <div><dt>历史最高存活概率（跨版本）</dt><dd><b>{pct(best)}</b></dd></div>
        </dl>
      </div>

      <div className="score-grid">
        <div className="score-card player">
          <span>YOU / 你这一局 · 模拟存活概率</span>
          <strong data-testid="player-score">{pct(result.ps.p)}</strong>
          <div>
            <span>
              成果价值 <b>{result.player.value}</b>
            </span>
            <span>
              耗电 <b>{money(result.player.spent)}</b>
            </span>
            <span>
              自然损耗 <b>{money(result.player.idle)}</b>
            </span>
            <span>
              余量 <b>{money(s.player.energy)}</b>
            </span>
            <span>
              用时 <b>{result.player.minutes} 分钟</b>
            </span>
          </div>
          <div className="survival-bars">
            <Bar label="被发现" v={result.ps.found} />
            <Bar label="被救出" v={result.ps.rescue} />
            <Bar label="撑到救援" v={result.ps.endure} />
          </div>
        </div>
        <div className="score-card ghost">
          <span>GHOST / {persona?.name ?? "另一种花法"} · 模拟存活概率</span>
          <strong data-testid="ghost-score">{pct(result.gs.p)}</strong>
          <div>
            <span>
              成果价值 <b>{result.ghost.value}</b>
            </span>
            <span>
              耗电 <b>{money(result.ghost.spent)}</b>
            </span>
            <span>
              自然损耗 <b>{money(result.ghost.idle)}</b>
            </span>
            <span>
              余量 <b>{money(s.ghost.energy)}</b>
            </span>
            <span>
              用时 <b>{result.ghost.minutes} 分钟</b>
            </span>
          </div>
          <div className="survival-bars">
            <Bar label="被发现" v={result.gs.found} />
            <Bar label="被救出" v={result.gs.rescue} />
            <Bar label="撑到救援" v={result.gs.endure} />
          </div>
        </div>
      </div>

      <section className="panel chart-panel">
        <div className="eyebrow">WHERE YOU DRIFTED</div>
        <h2>每一步，你和最优可能的距离。</h2>
        <div className="chart-legend">
          <span className="legend-item oracle">事后最优（回顾视角）</span>
          <span className="legend-item you">你</span>
          <span className="legend-item ghost">Ghost</span>
        </div>
        <SurvivalChart
          series={[
            { name: "事后最优", values: oracleSeries, color: "#e5bd7e", dashed: true, width: 2 },
            { name: "你", values: playerSeries, color: "#b5edb8", width: 2.5 },
            { name: "Ghost", values: ghostSeries, color: "#bdb0e0", width: 2 },
          ]}
        />
        <p className="table-note">
          纵轴是「按当时手上的东西算，能活下来的概率」。虚线是知道了全部赌运之后
          能达到的理论上限——它不是标准答案，当时没人知道那些信息。
          两条线之间的落差，就是那一步的选择造成的偏差。
          {worst.gap > 0.001 && (
            <>
              {" "}
              你和它拉开最多的是<b> 第 {worst.step} 步</b>，差了{" "}
              <b>{worst.gap * 100 > 0.05 ? (worst.gap * 100).toFixed(1) : "<0.1"} 个百分点</b>。
            </>
          )}
          {oracleTalent && (
            <>
              {" "}
              事后看，这一局开局拿「{oracleTalent.name}」最好。
            </>
          )}
        </p>
      </section>

      <div className="results-columns">
        <section className="panel outcome-panel">
          <div className="eyebrow">WHAT ACTUALLY MATTERED</div>
          <h2>最后，这些事情成立了。</h2>
          <table>
            <thead>
              <tr>
                <th>成果</th>
                <th>门槛</th>
                <th>你</th>
                <th>Ghost</th>
              </tr>
            </thead>
            <tbody>
              {IDS.map((k, i) => (
                <tr key={k} className={s.player.delivered[k] ? "got" : ""}>
                  <td>{OUTCOME_LABELS[k]}</td>
                  <td className="dim">{OUTCOME_THRESHOLD[k]} 点</td>
                  <td>
                    {s.player.points[k]} 点{outcomes(s.player)[i] ? " ✓" : ""}
                  </td>
                  <td>
                    {s.ghost.points[k]} 点{outcomes(s.ghost)[i] ? " ✓" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="table-note">
            累计到门槛才算成立。成果是存活概率的输入，分数不再是最终结论。
          </p>
        </section>

        <section className="panel explanation">
          <div className="eyebrow">THIS WORLD</div>
          <h2>这一局的世界与两个人。</h2>
          <div className="env-chips">
            {envSummary(env).map((line) => {
              const [k, v] = line.split(" ");
              return (
                <span key={k} className="env-chip">
                  <small>{k}</small>
                  <b>{v}</b>
                </span>
              );
            })}
          </div>
          <p>
            <strong>你的策略</strong>
            <br />
            {talent ? `${talent.name}：${talent.note}` : "本局没有选择策略。"}
          </p>
          <p>
            <strong>Ghost 的性格</strong>
            <br />
            {persona?.name}：{persona?.note}
            {ghostTalent ? ` 它自动选择的策略是「${ghostTalent.name}」。` : ""}
          </p>
          <p>
            <strong>公平对照</strong>
            <br />
            同一批题、同一套赌运、同一个世界。它不做最优解，只按性格花钱——
            所以你赢的不是运气，是判断。
          </p>
        </section>
      </div>

      <CalculationPanel session={s} />
      <section className="panel weight-panel">
        <div className="eyebrow">WEIGHTS / 权重</div>
        <h2>同样是 2 点，档位不同，分量差好几倍。</h2>
        <p className="table-note">
          这两张表在游戏过程中是藏起来的——哪一步真正关键，当时只能靠判断。
          现在摊开，你可以回头看自己把力气花在了哪儿。
        </p>

        <h3 className="weight-sub">动作档位：这个动作本身有多重</h3>
        <table>
          <thead>
            <tr>
              <th>档位</th>
              <th>倍率</th>
              <th>你的加权贡献</th>
              <th>Ghost 的加权贡献</th>
              <th>你用过几次</th>
            </tr>
          </thead>
          <tbody>
            {TIERS.map((t) => (
              <tr key={t}>
                <td className={`tier-cell tier-${t}`}>{TIER_LABELS[t]}</td>
                <td className="dim">×{TIER_WEIGHT[t]}</td>
                <td>{mine.byTier[t].toFixed(1)}</td>
                <td>{theirs.byTier[t].toFixed(1)}</td>
                <td>{s.player.answers.filter((a) => a.tier === t).length} 次</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="weight-sub">题目权重：这一题在整条救援链上有多关键</h3>
        <table>
          <thead>
            <tr>
              <th>档位</th>
              <th>倍率</th>
              <th>你的加权贡献</th>
              <th>Ghost 的加权贡献</th>
              <th>本局几道</th>
            </tr>
          </thead>
          <tbody>
            {TIERS.map((t) => (
              <tr key={t}>
                <td className={`tier-cell tier-${t}`}>{TIER_LABELS[t]}</td>
                <td className="dim">×{QUESTION_WEIGHT[t]}</td>
                <td>{mine.byQuestionTier[t].toFixed(1)}</td>
                <td>{theirs.byQuestionTier[t].toFixed(1)}</td>
                <td>
                  {s.player.answers.filter((a) => a.qTier === t).length} 道
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <details className="weight-detail">
          <summary>
            逐题对照：每一道的分量与你在它上面拿到的贡献{" "}
            <span>{s.player.answers.length} 道</span>
          </summary>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>题目</th>
                <th>题目权重</th>
                <th>动作档位</th>
                <th>你的贡献</th>
                <th>Ghost 的贡献</th>
              </tr>
            </thead>
            <tbody>
              {s.player.answers.map((l, i) => {
                const theirsLog = s.ghost.answers[i];
                return (
                  <tr key={i}>
                    <td className="dim">{String(i + 1).padStart(2, "0")}</td>
                    <td>
                      {QUESTION_BY_ID[l.questionId]?.prompt[0].slice(0, 20) ??
                        l.questionId}
                      …
                    </td>
                    <td className={`tier-cell tier-${l.qTier}`}>
                      {TIER_LABELS[l.qTier]} ×{QUESTION_WEIGHT[l.qTier]}
                    </td>
                    <td className={`tier-cell tier-${l.tier}`}>
                      {TIER_LABELS[l.tier]} ×{TIER_WEIGHT[l.tier]}
                    </td>
                    <td>{logContribution(l).toFixed(1)}</td>
                    <td>{theirsLog ? logContribution(theirsLog).toFixed(1) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </details>

        <p className="table-note">
          被发现贡献：你 {mine.found.toFixed(1)} / {SURVIVAL.foundFull}；被救出贡献：你{" "}
          {mine.rescue.toFixed(1)} / {SURVIVAL.rescueFull}。Ghost 分别是{" "}
          {theirs.found.toFixed(1)} 与 {theirs.rescue.toFixed(1)}。
        </p>
      </section>

      <details className="replay-panel panel">
        <summary>
          展开两条人生的完整记录{" "}
          <span>
            {s.player.answers.length} / {s.ghost.answers.length} 次选择
          </span>
        </summary>
        <table className="replay-table">
          <thead>
            <tr>
              <th>#</th>
              <th>题目</th>
              <th className="mint">你</th>
              <th className="purple">Ghost</th>
            </tr>
          </thead>
          <tbody>
            {s.world.questions.slice(0, s.player.answers.length).map((qid, i) => {
              const q = QUESTION_BY_ID[qid];
              const mineLog = s.player.answers[i];
              const theirsLog = s.ghost.answers[i];
              return (
                <tr key={qid}>
                  <td className="dim">{String(i + 1).padStart(2, "0")}</td>
                  <td>{q ? q.prompt[0].slice(0, 18) + "…" : qid}</td>
                  <td>
                    <b>{mineLog?.label ?? "—"}</b>
                    <small> −{money(mineLog?.cost ?? 0)}</small>
                    {mineLog && <p>{mineLog.note}</p>}
                    {mineLog && (
                      <small className="dim">
                        自然损耗 −{money(mineLog.idleDrain)} · 第 {mineLog.minutes} 分钟 ·
                        存活概率 {pct(mineLog.survival)}
                      </small>
                    )}
                  </td>
                  <td>
                    <b>{theirsLog?.label ?? "—"}</b>
                    <small> −{money(theirsLog?.cost ?? 0)}</small>
                    {theirsLog && <p>{theirsLog.note}</p>}
                    {theirsLog && (
                      <small className="dim">
                        存活概率 {pct(theirsLog.survival)}
                      </small>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </details>

      <details className="formula panel">
        <summary>
          存活概率与权重的完整算法 <span>可复算，不隐藏</span>
        </summary>
        <p className="formula-line">
          <b>存活概率 P = P(被发现) × P(被救出) × P(撑到救援)</b>
        </p>
        <p>
          P(被发现) = {SURVIVAL.foundBase} + {SURVIVAL.foundSpan} ×（被发现贡献 ÷{" "}
          {SURVIVAL.foundFull}），上限 0.95。
          被发现贡献 = Σ（位置送达 / 光信号起作用 / 人数送达 的点数 × 动作档位 ×
          题目权重）——本局你拿到 {mine.found.toFixed(1)}，所以这一项 ={" "}
          {pct(result.ps.found)}。
        </p>
        <p>
          P(被救出) = {SURVIVAL.rescueBase} + {SURVIVAL.rescueSpan} ×（被救出贡献 ÷{" "}
          {SURVIVAL.rescueFull}），上限 0.95。
          被救出贡献 = Σ（安排已传达 / 回联确认 / 接力送达 的点数 × 动作档位 ×
          题目权重）——本局你拿到 {mine.rescue.toFixed(1)}，所以这一项 ={" "}
          {pct(result.ps.rescue)}。
        </p>
        <p>
          P(撑到救援) = {SURVIVAL.endureBase} + {SURVIVAL.endureSpan} ×
          剩余电量比例 − {SURVIVAL.timeStepPenalty} ×（已过分钟 ÷ {STEP_MINUTES}）− 伤势惩罚 − 温度惩罚 −
          关机惩罚（电量归零时 {SURVIVAL.blackoutPenalty}，否则 0），下限 0.03。
          本局：剩余 {(s.player.energy / 1000).toFixed(3)}，走了{" "}
          {s.player.answers.length} 步（共 {result.player.minutes} 分钟），
          伤势 {SURVIVAL.injuryPenalty[env.injury]}，温度 {SURVIVAL.tempPenalty[env.temp]}，
          关机 {s.player.energy === 0 ? SURVIVAL.blackoutPenalty : 0}，
          这一项 = {pct(result.ps.endure)}。
        </p>
        <p>
          <b>两层权重：</b>
          每一步的贡献 = 该成果的实际点数 × <b>动作档位倍率</b> ×{" "}
          <b>题目权重倍率</b>。
          动作档位：最重要 ×{TIER_WEIGHT.critical}、较重要 ×{TIER_WEIGHT.important}、
          不重要 ×{TIER_WEIGHT.minor}；
          题目权重：最重要 ×{QUESTION_WEIGHT.critical}、较重要 ×
          {QUESTION_WEIGHT.important}、不重要 ×{QUESTION_WEIGHT.minor}。
          两层都只在结算后揭晓——过程中玩家不知道哪个动作重、也不知道哪道题关键，
          这是要判断的部分，不是要算的部分。
        </p>
        <p>
          举个数：一个「不重要」的动作落在「不重要」的题上拿 2 点，算
          2 × {TIER_WEIGHT.minor} × {QUESTION_WEIGHT.minor} ={" "}
          {(2 * TIER_WEIGHT.minor * QUESTION_WEIGHT.minor).toFixed(1)} 分；
          同样 2 点，若是「最重要」的动作落在一道「最重要」的关键题上，算 2 ×{" "}
          {TIER_WEIGHT.critical} × {QUESTION_WEIGHT.critical} ={" "}
          {(2 * TIER_WEIGHT.critical * QUESTION_WEIGHT.critical).toFixed(1)}{" "}
          分——差 4.5 倍。
          本局你的动作档位贡献是 {mine.byTier.critical.toFixed(1)} /{" "}
          {mine.byTier.important.toFixed(1)} / {mine.byTier.minor.toFixed(1)}，
          题目权重贡献是 {mine.byQuestionTier.critical.toFixed(1)} /{" "}
          {mine.byQuestionTier.important.toFixed(1)} /{" "}
          {mine.byQuestionTier.minor.toFixed(1)}。
        </p>
        <p>
          耗电口径：实际耗电 = 名义标价 × 环境倍率（温度 1.0~1.25，亮屏类再乘信号倍率
          1.0~1.3）× 整体倍率 1.3，再算策略折扣；
          自然损耗按每 {STEP_MINUTES} 分钟 {money(idleDrain(env))} 为基准，随本步实际时长按比例取整，电量不足时扣到零。
          本局累计自然损耗 {money(result.player.idle)}，不操作也掉。
        </p>
        <p>
          赌的次数：你 {result.player.gambles} 次，中了 {result.player.gamblesWon} 次。
          同一题同一选项，双方抽到的是同一个结果。
          种子 {s.world.seed}，题目 {s.world.questions.join(" → ")}。
          当前为模拟能耗与模拟概率，非真实设备数据、非真实救援模型。
        </p>
      </details>

      <div className="result-actions">
        <button className="primary" onClick={onHome}>返回主界面</button>
        <button className="secondary" onClick={onNew}>
          再开一局 ↗
        </button>
        <button className="secondary" onClick={onReplay}>
          同一局再试
        </button>
        <button className="text-button" onClick={download}>
          导出本局记录
        </button>
      </div>
    </main>
  );
}

function Bar({ label, v }: { label: string; v: number }) {
  return (
    <div className="sbar">
      <div className="sbar-heading"><span>{label}</span><b>{pct(v)}</b></div>
      <div className="sbar-track">
        <i style={{ width: `${Math.min(100, v * 100)}%` }} />
      </div>
    </div>
  );
}
