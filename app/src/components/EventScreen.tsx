import { useEffect, useState } from "react";
import { QUESTION_BY_ID } from "../game/content/questions";
import { PERSONA_BY_ID } from "../game/content/personas";
import { TALENT_BY_ID } from "../game/content/talents";
import {
  OUTCOME_LABELS,
  OUTCOME_WEIGHTS,
  STEP_MINUTES,
  idleDrain,
} from "../game/config";
import { hasAffordable, preview, visibleIndexes } from "../game/engine";
import { pick } from "../game/rng";
import { summarize } from "../game/scoring";
import { envSummary } from "../game/world";
import { useTypewriter } from "./useTypewriter";
import type { OutcomeId, Session } from "../game/types";

const money = (n: number) => `${(n / 1000).toFixed(3)}%`;

export default function EventScreen({
  session: s,
  onChoose,
  onDrain,
  onAbandon,
}: {
  session: Session;
  onChoose: (index: number) => void;
  onDrain: () => void;
  onAbandon: () => void;
}) {
  const w = s.world;
  const qid = w.questions[s.step];
  const q = QUESTION_BY_ID[qid];
  const persona = PERSONA_BY_ID[s.ghostPersona];
  const text = q ? pick(w.seed, `prompt:${q.id}`, q.prompt) : "";
  const typed = useTypewriter(text);
  const me = summarize(s.player);
  const ghost = summarize(s.ghost);
  const last = s.player.answers.at(-1);
  const [confirming, setConfirming] = useState(false);

  const idle = idleDrain(w.env);
  const minutes = s.player.answers.length * STEP_MINUTES;

  const options = q
    ? visibleIndexes(w, q).map((i) => ({ index: i, option: q.options[i], p: preview(w, s.player, q, i) }))
    : [];
  const stuck = q ? !hasAffordable(w, s.player, q) : false;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1 || n > 9) return;
      const picked = options[n - 1];
      if (!picked || !picked.p.affordable) return;
      e.preventDefault();
      onChoose(picked.index);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [options, onChoose]);

  if (!q) return null;

  return (
    <main className="game-screen">
      <div className="game-heading">
        <span className="eyebrow">
          {s.world.preset ? `固定案例 ${s.world.preset}` : "随机人生"}{" "}
          <span className="seed">#{w.seed}</span>
        </span>
        <span className="pause-note">
          第 {s.step + 1} 步 · 已过去 {minutes} 分钟 · 还剩几步未知 ·
          阅读和思考不耗电
        </span>
        <button
          className="give-up-button"
          onClick={() => setConfirming((v) => !v)}
          data-testid="abandon"
        >
          {confirming ? "再想想" : "放弃这一局"}
        </button>
      </div>

      {confirming && (
        <div className="give-up-box" role="alert">
          <span>
            放弃后本局不计入记录，你可以立刻重开一局新的。确定要放弃吗？
          </span>
          <button className="danger" onClick={onAbandon}>
            确定放弃并重开
          </button>
          <button className="text-button" onClick={() => setConfirming(false)}>
            继续这一局
          </button>
        </div>
      )}

      <div className="resource-bar">
        <div>
          <span className="stat-label">最后 1% 的余量</span>
          <strong data-testid="battery">
            {money(s.player.energy)}
            <small> / 1.000%</small>
          </strong>
          <div className="energy-track">
            <i style={{ width: `${(s.player.energy / 1000) * 100}%` }} />
          </div>
          <small>
            每 {STEP_MINUTES} 分钟自然损耗 −{money(idle)}（不操作也掉）
          </small>
        </div>
        <div>
          <span className="stat-label">已形成的成果</span>
          <strong data-testid="value">
            {me.value}
            <small> / 12</small>
          </strong>
          <div className="outcome-dots">
            {(Object.keys(OUTCOME_WEIGHTS) as OutcomeId[]).map((k) => (
              <i
                key={k}
                className={s.player.delivered[k] ? "on" : ""}
                title={OUTCOME_LABELS[k]}
              />
            ))}
          </div>
          <small>已耗电 {money(me.spent)} · 自然损耗 {money(me.idle)}</small>
        </div>
        <div>
          <span className="stat-label">已过去的时间</span>
          <strong className="talent-inline">{minutes} 分钟</strong>
          <small>
            每一步固定 {STEP_MINUTES} 分钟 · 时间也在消耗机会
          </small>
          <small>
            天赋：{s.player.talent ? (TALENT_BY_ID[s.player.talent]?.name ?? "—") : "—"}
          </small>
        </div>
      </div>

      <div className="env-strip">
        {envSummary(w.env).map((line) => {
          const [k, v] = line.split(" ");
          return (
            <span key={k} className="env-chip">
              <small>{k}</small>
              <b>{v}</b>
            </span>
          );
        })}
      </div>

      <div className="game-columns">
        <section className="event-panel panel">
          <div className="chapter-row">
            <span>
              {q.stage === "early" ? "Ⅰ 处境" : q.stage === "mid" ? "Ⅱ 送出" : "Ⅲ 余量"}
            </span>
            <span className="chapter-unknown">后面还有几步：？</span>
          </div>
          <p
            className={"event-story" + (typed.done ? "" : " typing")}
            onClick={typed.skip}
          >
            {typed.shown}
            {!typed.done && <span className="caret" aria-hidden="true" />}
          </p>
          {!typed.done && (
            <button className="skip-type" onClick={typed.skip}>
              跳过这段 ▸
            </button>
          )}

          <div className="choices">
            <div className="choice-heading">
              你的选择{" "}
              <span>
                标价已按当前环境折算 · 每道题和每个动作的分量要到结算后才揭晓 · 可按
                1–{options.length} 键
              </span>
            </div>
            {options.map(({ index, option, p }, i) => (
              <button
                key={index}
                className={`choice ${option.tags.includes("wait") ? "wait-choice" : ""}`}
                disabled={!p.affordable}
                data-testid={`option-${i}`}
                onClick={() => onChoose(index)}
              >
                <span className="choice-index">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="choice-body">
                  <strong>{option.label}</strong>
                  <small>{option.detail}</small>
                  <span className="choice-tags">
                    {option.gain && (
                      <em className="tag-gain">
                        {OUTCOME_LABELS[option.gain.outcome]} +{option.gain.points}
                      </em>
                    )}
                    {option.gamble && (
                      <em className="tag-risk">
                        {OUTCOME_LABELS[option.gamble.outcome]} +{option.gamble.points}（
                        {Math.round(option.gamble.odds * 100)}% 把握）
                      </em>
                    )}
                    {!option.gain && !option.gamble && <em className="tag-none">没有确定收益</em>}
                  </span>
                </span>
                <span className="choice-cost">
                  <b>{p.cost ? `−${money(p.cost)}` : "不耗电"}</b>
                  <small>
                    {p.affordable
                      ? `做完剩 ${money(Math.max(0, s.player.energy - p.cost - p.idle))}`
                      : "电量不够"}
                  </small>
                </span>
                <span className="choice-arrow">↗</span>
              </button>
            ))}
            {stuck && (
              <button className="choice drain-choice" onClick={onDrain}>
                <span className="choice-index">!!</span>
                <span className="choice-body">
                  <strong>攥着手机，什么都做不了了</strong>
                  <small>剩下这点电，任何一项都撑不起来。合上手机，等最后的结果。</small>
                </span>
                <span className="choice-arrow">↗</span>
              </button>
            )}
          </div>
        </section>

        <aside className="game-aside">
          <div className="ghost-card panel">
            <div className="panel-kicker">
              <span className="ghost-dot" /> YOUR GHOST
            </div>
            <h2>
              同一批题，
              <br />
              另一种花法。
            </h2>
            <p className="ghost-persona">{persona?.note}</p>
            <div className="ghost-stats">
              <div>
                <small>剩余</small>
                <strong>{money(s.ghost.energy)}</strong>
              </div>
              <div>
                <small>成果</small>
                <strong>{ghost.value}</strong>
              </div>
            </div>
            <div className="ghost-meter">
              <i style={{ width: `${(s.ghost.energy / 1000) * 100}%` }} />
            </div>
            <small className="ghost-foot">
              已同步 {s.ghost.answers.length} 题 · 它这一题的选择你还看不到
            </small>
          </div>

          {last && (
            <div className="last-action panel" aria-live="polite">
              <span className="eyebrow">上一步的结果</span>
              <h3>
                {last.label} <span>−{money(last.cost)}</span>
              </h3>
              <p>{last.note}</p>
              <small>
                那 {STEP_MINUTES} 分钟自然又掉了 {money(last.idleDrain)} · 此时已过去{" "}
                {last.minutes} 分钟
              </small>
            </div>
          )}

          <details className="journal">
            <summary>
              查看自己的全部选择 <span>{s.player.answers.length}</span>
            </summary>
            <ol className="log-list">
              {s.player.answers.map((l, i) => (
                <li key={i}>
                  <span className="log-idx">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{l.label}</strong>{" "}
                    <span className="log-cost">−{money(l.cost)}</span>
                    <p>{l.note}</p>
                  </div>
                </li>
              ))}
            </ol>
          </details>

          <details className="journal">
            <summary>本局规则</summary>
            <p className="muted">
              电量 1.000%，共 8~12 步，具体几步不告诉你。每一步固定推进{" "}
              {STEP_MINUTES} 分钟，这 {STEP_MINUTES} 分钟里电池一定会自然损耗——
              不操作也掉，炎热、严寒、信号差都会掉得更快。选项的标价是名义耗电，
              实际耗电与收益会被灾种、信号、伤势、温度、时段、随身物改写。
              赌运对双方一致——你和 Ghost 在同一选项上抽到同一个结果，
              所以差距只来自选择。
              每道题、每个动作都带着自己的权重，但过程中不告诉你：
              哪一步真正关键，得你自己判断。结算时全部摊开，可以复算。
            </p>
          </details>
        </aside>
      </div>
    </main>
  );
}
