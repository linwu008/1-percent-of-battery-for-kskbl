import { OUTCOME_LABELS, OUTCOME_THRESHOLD, OUTCOME_WEIGHTS } from "../game/config";
import { QUESTION_BY_ID } from "../game/content/questions";
import { PERSONA_BY_ID } from "../game/content/personas";
import { TALENT_BY_ID } from "../game/content/talents";
import { compare, outcomes } from "../game/scoring";
import { envSummary } from "../game/world";
import type { OutcomeId, Profile, Session } from "../game/types";

const money = (n: number) => `${(n / 1000).toFixed(3)}%`;
const IDS = Object.keys(OUTCOME_WEIGHTS) as OutcomeId[];

export default function ResultsScreen({
  session: s,
  profile,
  onNew,
  onReplay,
}: {
  session: Session;
  profile: Profile;
  onNew: () => void;
  onReplay: () => void;
}) {
  const result = compare(s.player, s.ghost);
  const persona = PERSONA_BY_ID[s.ghostPersona];
  const talent = s.player.talent ? TALENT_BY_ID[s.player.talent] : null;
  const ghostTalent = TALENT_BY_ID[s.world.ghostTalent];
  const best = Math.max(profile.best, result.player.score);

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
      <div className="result-top">
        <div>
          <span className="eyebrow">YOUR LAST ONE PERCENT</span>
          <h1>
            {result.label}
            <span className="result-star">✳</span>
          </h1>
          <p className="muted">
            {result.delta > 0
              ? "你把同样这一点余量，换成了更多作用。"
              : result.delta < 0
                ? "留住电量，不一定留住机会。这次差距，有迹可循。"
                : "相同的起点，留下了接近的成果。下一次，换一种花法试试。"}
          </p>
        </div>
        <div className="result-delta">
          <span>相对 Ghost</span>
          <strong>
            {result.delta > 0 ? "+" : ""}
            {result.delta.toFixed(1)}
          </strong>
          <small>
            规则 {s.world.version} · 历史最高 {best.toFixed(1)}
          </small>
        </div>
      </div>

      <div className="score-grid">
        <div className="score-card player">
          <span>YOU / 你这一局</span>
          <strong data-testid="player-score">{result.player.score}</strong>
          <div>
            <span>
              成果价值 <b>{result.player.value}</b>
            </span>
            <span>
              耗电 <b>{result.player.cost.toFixed(3)}</b>
            </span>
            <span>
              余量 <b>{result.player.remaining.toFixed(3)}</b>
            </span>
          </div>
        </div>
        <div className="score-card ghost">
          <span>GHOST / {persona?.name ?? "另一种花法"}</span>
          <strong data-testid="ghost-score">{result.ghost.score}</strong>
          <div>
            <span>
              成果价值 <b>{result.ghost.value}</b>
            </span>
            <span>
              耗电 <b>{result.ghost.cost.toFixed(3)}</b>
            </span>
            <span>
              余量 <b>{result.ghost.remaining.toFixed(3)}</b>
            </span>
          </div>
        </div>
      </div>

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
            累计到门槛才算成立。分值是游戏内的成果价值，不是真实生存概率。
          </p>
        </section>

        <section className="panel explanation">
          <div className="eyebrow">THIS WORLD</div>
          <h2>这一局的世界与两个人。</h2>
          <div className="env-chips">
            {envSummary(s.world.env).map((line) => {
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
            <strong>你的天赋</strong>
            <br />
            {talent ? `${talent.name}：${talent.note}` : "本局没有选择天赋。"}
          </p>
          <p>
            <strong>Ghost 的性格</strong>
            <br />
            {persona?.name}：{persona?.note}
            {ghostTalent ? ` 它自己的天赋是「${ghostTalent.name}」。` : ""}
          </p>
          <p>
            <strong>公平对照</strong>
            <br />
            同一批题、同一套赌运、同一个世界。它不做最优解，只按性格花钱——
            所以你赢的不是运气，是判断。
          </p>
        </section>
      </div>

      <details className="replay-panel panel" open>
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
            {s.world.questions.map((qid, i) => {
              const q = QUESTION_BY_ID[qid];
              const mine = s.player.answers[i];
              const theirs = s.ghost.answers[i];
              return (
                <tr key={qid}>
                  <td className="dim">{String(i + 1).padStart(2, "0")}</td>
                  <td>{q ? q.prompt[0].slice(0, 18) + "…" : qid}</td>
                  <td>
                    <b>{mine?.label ?? "—"}</b>
                    <small> −{money(mine?.cost ?? 0)}</small>
                    {mine && <p>{mine.note}</p>}
                  </td>
                  <td>
                    <b>{theirs?.label ?? "—"}</b>
                    <small> −{money(theirs?.cost ?? 0)}</small>
                    {theirs && <p>{theirs.note}</p>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </details>

      <details className="formula panel">
        <summary>
          评分与模型说明 <span>可复算，不隐藏</span>
        </summary>
        <p>
          有成果时：分数 = 11 × 成果价值 + 剩余电量比例 × 10；成果价值为 0
          时分数为 0——省电本身不构成胜利。
        </p>
        <p>
          单位耗电产出：你 {result.player.efficiency?.toFixed(2) ?? "不适用"}
          ，Ghost {result.ghost.efficiency?.toFixed(2) ?? "不适用"}。该比值不决定排名。
        </p>
        <p>
          赌的次数：你 {result.player.gambles} 次，中了 {result.player.gamblesWon} 次。
          同一题同一选项，双方抽到的是同一个结果。
        </p>
        <p>
          种子 {s.world.seed}，题目 {s.world.questions.join(" → ")}。
          当前为模拟能耗，非真实设备数据。
        </p>
      </details>

      <div className="result-actions">
        <button className="primary" onClick={onNew}>
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
