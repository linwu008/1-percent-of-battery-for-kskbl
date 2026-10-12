import { choices, visibleContext } from "../game/engine";
import { summarize } from "../game/scoring";
import type { Action, Session, LogEntry } from "../game/types";
export function actionName(l: LogEntry): string {
  const a = l.action;
  return a.kind === "send"
    ? "发送信息"
    : a.kind === "light"
      ? `${a.duration}秒光信号`
      : a.kind === "brief"
        ? a.method === "paper"
          ? "纸笔传阅"
          : "亮屏展示"
        : "等待";
}
export function LogList({ logs }: { logs: LogEntry[] }) {
  return (
    <ol className="log-list">
      {logs.map((l) => (
        <li key={l.id}>
          <time>
            {l.start}–{l.end}s
          </time>
          <div>
            <strong>{actionName(l)}</strong>
            <span className="log-cost">−{(l.cost / 10).toFixed(1)} 电</span>
            <p>{l.gained.length ? l.gained.join("、") : l.note}</p>
            <small>
              {l.context}。{l.interrupted ? " 本次行动未完整完成。" : ""}
            </small>
          </div>
        </li>
      ))}
    </ol>
  );
}
export default function EventScreen({
  session: s,
  onChoose,
}: {
  session: Session;
  onChoose: (a: Action) => void;
}) {
  const a = s.player,
    t = a.time;
  const event = t < 60 ? 0 : t < 100 ? 1 : t < 110 ? 2 : 3;
  const titles = [
    "先报位置，还是等齐信息？",
    "让那边的人，看见这里。",
    "把安排，传到每个人手里。",
    "还有一次，把话说清的机会。",
  ];
  const text =
    t < 60
      ? t < 20
        ? "你已经确认所在的位置。同行者还在清点人数，预计第20秒会告诉你结果。先把位置发出去，还是等齐后一起发送？"
        : "人数已经确认。你可以发送尚未送达的内容，也可以留下电量，面对稍后的机会。"
      : t < 100
        ? t < 80
          ? "远处的联络人员正在观察这片区域。你可以用手机灯光发出信号，持续多久，由你决定。"
          : "对方已经移开视线。刚才发出的信号是否足够，会影响他们对这片区域的了解。"
        : t < 110
          ? "本区联络安排已经到达。同行者需要知道稍后的安排；抄写不用电，展示屏幕则更快。"
          : a.firstContact
            ? "你先前发出的位置建立了联系。对方发来确认请求，等待你回应。"
            : "初次通信没有建立联系。现在还可以补发位置，但本局不会再有一轮确认。";
  const ghost = summarize(s.ghost);
  const last = a.logs.at(-1);
  return (
    <main className="game-screen">
      <div className="game-heading">
        <span className="eyebrow">
          {s.practice
            ? "同局练习 · 不计入成长"
            : s.world.preset
              ? `固定案例 ${s.world.preset}`
              : "新的随机人生"}{" "}
          <span className="seed">#{s.world.seed}</span>
        </span>
        <span className="pause-note">Ⅱ 阅读和思考时，时间暂停</span>
      </div>
      <div className="resource-bar">
        <div>
          <span className="stat-label">最后 1% 的余量</span>
          <strong>
            {(a.energy / 10).toFixed(1)}
            <small> / 10</small>
          </strong>
          <div className="energy-track">
            <i style={{ width: `${a.energy}%` }} />
          </div>
        </div>
        <div data-testid="game-time" data-time={t}>
          <span className="stat-label">游戏时间</span>
          <strong>
            {String(Math.floor(t / 60)).padStart(2, "0")}
            <span className="time-colon">:</span>
            {String(t % 60).padStart(2, "0")}
          </strong>
          <small>由行动推进</small>
        </div>
        <div>
          <span className="stat-label">已经发挥作用</span>
          <strong>
            {summarize(a).value}
            <small> 成果价值</small>
          </strong>
          <small>成果优先，耗电其次</small>
        </div>
      </div>
      <div className="game-columns">
        <section className="event-panel panel">
          <div className="chapter-row">
            <span>CHAPTER 0{event + 1}</span>
            <div className="chapter-dots">
              {[0, 1, 2, 3].map((n) => (
                <i key={n} className={n <= event ? "active" : ""} />
              ))}
            </div>
          </div>
          <h1>{titles[event]}</h1>
          <p className="event-story">{text}</p>
          <div className="condition">
            <span>◉</span>
            <div>
              <small>当前可知条件</small>
              <strong>{visibleContext(s.world, a)}</strong>
            </div>
          </div>
          {a.energy === 0 && (
            <p className="empty-note">
              手机已经关机。你仍可以等待、传递已有信息，完成这段经历。
            </p>
          )}
          <div className="choices">
            <div className="choice-heading">
              你的选择 <span>成本均为模拟值</span>
            </div>
            {choices(s.world, a).map((c, i) => (
              <button
                key={JSON.stringify(c.action)}
                className={`choice ${c.action.kind === "wait" ? "wait-choice" : ""}`}
                disabled={!!c.disabled}
                onClick={(e) => {
                  if (e.detail < 2) onChoose(c.action);
                }}
              >
                <span className="choice-index">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="choice-body">
                  <strong>{c.title}</strong>
                  <small>{c.disabled || c.detail}</small>
                </span>
                <span className="choice-cost">
                  <b>{c.cost ? `−${c.cost / 10} 电` : "不耗电"}</b>
                  <small>{c.duration} 秒</small>
                </span>
                <span className="choice-arrow">↗</span>
              </button>
            ))}
          </div>
        </section>
        <aside className="game-aside">
          <div className="ghost-card panel">
            <div className="panel-kicker">
              <span className="ghost-dot" /> YOUR GHOST{" "}
              <span>V{s.ghostVersion}</span>
            </div>
            <h2>
              同一时刻，
              <br />
              另一个选择。
            </h2>
            <p>
              它正在经历相同的环境。
              <br />
              下一步，它也并不知道。
            </p>
            <div className="ghost-stats">
              <div>
                <small>剩余能量</small>
                <strong>{ghost.remaining.toFixed(1)}</strong>
              </div>
              <div>
                <small>成果价值</small>
                <strong>{ghost.value}</strong>
              </div>
            </div>
            <div className="ghost-meter">
              <i style={{ width: `${s.ghost.energy}%` }} />
            </div>
            <small className="ghost-foot">
              已同步至 {t} 秒 · 完整路线在结算后展开
            </small>
          </div>
          {last && (
            <div className="last-action panel" aria-live="polite">
              <span className="eyebrow">刚才的选择</span>
              <h3>
                {actionName(last)} <span>−{last.cost / 10} 电</span>
              </h3>
              <p>{last.gained.join("、") || last.note}</p>
              <small>
                {last.interrupted
                  ? "只计算已发生的消耗，已完成成果保留。"
                  : `推进了 ${last.end - last.start} 秒，后续机会随时间变化。`}
              </small>
            </div>
          )}
          <details className="journal">
            <summary>
              查看自己的行动记录 <span>{a.logs.length}</span>
            </summary>
            <LogList logs={a.logs} />
          </details>
        </aside>
      </div>
    </main>
  );
}
