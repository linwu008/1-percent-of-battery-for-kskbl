import { useEffect, useState } from "react";
import { QUESTION_BY_ID } from "../game/content/questions";
import { PERSONA_BY_ID } from "../game/content/personas";
import { TALENT_BY_ID } from "../game/content/talents";
import { OUTCOME_LABELS, OUTCOME_WEIGHTS, ROUNDS } from "../game/config";
import { hasAffordable, preview, visibleIndexes } from "../game/engine";
import { pick } from "../game/rng";
import { summarize } from "../game/scoring";
import { envSummary } from "../game/world";
import type { OutcomeId, Session } from "../game/types";

/**
 * 逐字显示正文。打字只影响显示，不推进进度、不消耗电量。
 * 尊重系统的「减少动效」设置，并允许随时点击跳过。
 */
function useTypewriter(text: string, speed = 26) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(0);
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setCount(text.length);
      return;
    }
    const id = window.setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          window.clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, speed);
    return () => window.clearInterval(id);
  }, [text, speed]);

  const skip = () => setCount(text.length);
  return { shown: text.slice(0, count), done: count >= text.length, skip };
}

const money = (n: number) => `${(n / 1000).toFixed(3)}%`;

export default function EventScreen({
  session: s,
  onChoose,
  onDrain,
}: {
  session: Session;
  onChoose: (index: number) => void;
  onDrain: () => void;
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
          第 {s.step + 1} / {Math.min(ROUNDS, w.questions.length)} 题 ·
          思考和阅读不耗电
        </span>
      </div>

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
        </div>
        <div>
          <span className="stat-label">你的天赋</span>
          <strong className="talent-inline">
            {s.player.talent ? (TALENT_BY_ID[s.player.talent]?.name ?? "—") : "—"}
          </strong>
          <small>已生效</small>
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
            <div className="chapter-dots">
              {w.questions.map((_, n) => (
                <i key={n} className={n <= s.step ? "active" : ""} />
              ))}
            </div>
          </div>
          <h1 className="event-title">{q.id.toUpperCase()}</h1>
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
              你的选择 <span>标价是名义耗电 · 实际收益受环境影响 · 可按 1–{options.length} 键</span>
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
                    {p.affordable ? `做完剩 ${money(s.player.energy - p.cost)}` : "电量不够"}
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
              <span className="eyebrow">上一题的结果</span>
              <h3>
                {last.label} <span>−{money(last.cost)}</span>
              </h3>
              <p>{last.note}</p>
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
              电量 1.000%，十道题。每道题的标价是名义耗电，实际收益会被灾种、信号、伤势、
              温度、时段、随身物改写。赌运对双方一致——你和 Ghost 在同一选项上抽到同一个
              结果，所以差距只来自选择。
            </p>
          </details>
        </aside>
      </div>
    </main>
  );
}
