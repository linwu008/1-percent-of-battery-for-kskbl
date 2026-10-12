import { useState } from "react";
import type { Profile, Session } from "../game/types";
import { compare, outcomes } from "../game/scoring";
import { growthOffer } from "../game/ghost";
import { LogList } from "./EventScreen";
export default function ResultsScreen({
  session: s,
  profile,
  onNew,
  onReplay,
  onGrow,
}: {
  session: Session;
  profile: Profile;
  onNew: () => void;
  onReplay: () => void;
  onGrow: () => void;
}) {
  const result = compare(s.player, s.ghost);
  const [declined, setDeclined] = useState(false);
  const names = ["位置送达", "人数送达", "光信号作用", "安排传达", "回联确认"];
  const sendCost = (actor: typeof s.player) =>
    actor.logs
      .filter((l) => l.action.kind === "send" && l.start < 60)
      .reduce((n, l) => n + l.cost / 10, 0);
  const sameFirst =
    s.player.firstContact === s.ghost.firstContact &&
    s.player.logs.some((l) => l.start < 60 && l.gained.includes("人数送达")) ===
      s.ghost.logs.some((l) => l.start < 60 && l.gained.includes("人数送达"));
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
              ? "你把有限的余量，变成了更多作用。"
              : result.delta < 0
                ? "留住电量，不一定留住机会。这次差距，有迹可循。"
                : "相同的起点，留下了接近的成果。下一次，试试另一种顺序。"}
          </p>
        </div>
        <div className="result-delta">
          <span>相对 Ghost</span>
          <strong>
            {result.delta > 0 ? "+" : ""}
            {result.delta.toFixed(1)}
          </strong>
          <small>
            规则 {s.world.version} · Ghost V{s.ghostVersion}
          </small>
        </div>
      </div>
      <div className="score-grid">
        <div className="score-card player">
          <span>YOU / 你的这条人生</span>
          <strong data-testid="player-score">{result.player.score}</strong>
          <div>
            <span>
              成果价值 <b>{result.player.value}</b>
            </span>
            <span>
              耗电 <b>{result.player.cost.toFixed(1)}</b>
            </span>
            <span>
              余量 <b>{result.player.remaining.toFixed(1)}</b>
            </span>
          </div>
        </div>
        <div className="score-card ghost">
          <span>GHOST / 习惯中的另一条路</span>
          <strong data-testid="ghost-score">{result.ghost.score}</strong>
          <div>
            <span>
              成果价值 <b>{result.ghost.value}</b>
            </span>
            <span>
              耗电 <b>{result.ghost.cost.toFixed(1)}</b>
            </span>
            <span>
              余量 <b>{result.ghost.remaining.toFixed(1)}</b>
            </span>
          </div>
        </div>
      </div>
      <div className="results-columns">
        <section className="panel outcome-panel">
          <div className="eyebrow">WHAT ACTUALLY MATTERED</div>
          <h2>最后，这些事情发生了。</h2>
          <table>
            <thead>
              <tr>
                <th>有效成果</th>
                <th>你</th>
                <th>Ghost</th>
              </tr>
            </thead>
            <tbody>
              {names.map((name, i) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{outcomes(s.player)[i] || "—"}</td>
                  <td>{outcomes(s.ghost)[i] || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="table-note">
            分值表示游戏内成果价值，不是真实生存概率。
          </p>
        </section>
        <section className="panel explanation">
          <div className="eyebrow">WHY IT CHANGED</div>
          <h2>差距，来自具体的选择。</h2>
          <p>
            <strong>通信的重复开销</strong>
            <br />
            首次通信你消耗 {sendCost(s.player).toFixed(1)} 电，Ghost 消耗{" "}
            {sendCost(s.ghost).toFixed(1)} 电。
            {sameFirst && sendCost(s.ghost) > 0
              ? `该阶段成果相同，耗电变化 ${(((sendCost(s.ghost) - sendCost(s.player)) / sendCost(s.ghost)) * 100).toFixed(1)}%。`
              : "双方该阶段成果不同，不能只用耗电判断优劣。"}
          </p>
          <p>
            <strong>后续机会</strong>
            <br />
            {s.player.delivered.ack
              ? "你保留了足够的电量和时间，完成了最后一次回联。"
              : !s.player.firstContact
                ? "首次窗口没有建立联系，最后只能尝试补发位置。"
                : s.player.energy < 30
                  ? "剩余电量不足以再次发送，已经取得的成果仍然保留。"
                  : "你没有在窗口内完成回联；可以从时间线检查选择和耗时。"}
          </p>
          <p>
            <strong>一次结果，不代表策略永远正确</strong>
            <br />
            信号窗口与可见度影响选择价值。下方记录保留当时线索、实际成本和后果。
          </p>
        </section>
      </div>
      <details className="formula panel">
        <summary>
          评分与模型说明 <span>可复算，不隐藏</span>
        </summary>
        <p>
          有成果时：分数 = 11 × 成果价值 +
          剩余电量；无成果时分数为0。优先比较成果价值，相同时比较耗电。
        </p>
        <p>
          单位耗电产出：你 {result.player.efficiency?.toFixed(2) ?? "不适用"}
          ，Ghost {result.ghost.efficiency?.toFixed(2) ?? "不适用"}
          。该比值不决定排名。
        </p>
        <p>
          {result.saving === null
            ? "双方原始成果不同或Ghost耗电为0，不计算全局同成果节省率。"
            : `全局同成果节省率 ${(result.saving * 100).toFixed(1)}%。`}
        </p>
        <p>
          种子 {s.world.seed}；首次窗口 {s.world.firstClose}s 关闭；第二窗口{" "}
          {s.world.secondClose}s 关闭；当前为模拟能耗。
          {s.practice ? "本局为已知环境练习，不计成长。" : ""}
        </p>
      </details>
      <details className="replay-panel panel">
        <summary>
          展开两条人生的完整记录{" "}
          <span>
            {s.player.logs.length} / {s.ghost.logs.length} 次行动
          </span>
        </summary>
        <div className="replay-columns">
          <div>
            <h3 className="mint">你的选择</h3>
            <LogList logs={s.player.logs} />
          </div>
          <div>
            <h3 className="purple">Ghost 的选择</h3>
            <LogList logs={s.ghost.logs} />
          </div>
        </div>
      </details>
      {!s.practice && growthOffer(profile) && !declined && (
        <section className="growth-card">
          <div>
            <span className="eyebrow">GHOST CAN LEARN</span>
            <h2>它注意到了你的习惯。</h2>
            <p>
              在 {profile.observations.length}{" "}
              局记录中，你在清楚视线下用短光信号取得相同成果，少耗1电。6个条件样本的局部回放验证通过。
            </p>
            <p>
              允许后，它从下一局学会这项习惯；有遮挡时仍使用长光信号，本局结果不变。
            </p>
          </div>
          <div className="growth-actions">
            <button className="primary" onClick={onGrow}>
              允许 Ghost 成长
            </button>
            <button className="secondary" onClick={() => setDeclined(true)}>
              这次不成长
            </button>
          </div>
        </section>
      )}
      {profile.ghostVersion > s.ghostVersion && (
        <p className="growth-confirm">
          Ghost 已学会短光习惯，将从下一局生效。本局对照仍为 V{s.ghostVersion}。
        </p>
      )}
      <div className="result-actions">
        <button className="primary" onClick={onNew}>
          再开一局 ↗
        </button>
        <button className="secondary" onClick={onReplay}>
          同局再试
        </button>
        <button className="text-button" onClick={download}>
          导出本局记录
        </button>
      </div>
    </main>
  );
}
