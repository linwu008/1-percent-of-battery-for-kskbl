import { useEffect, useRef, useState } from "react";
import { QUESTION_BY_ID } from "../game/content/questions";
import { PERSONA_BY_ID } from "../game/content/personas";
import { TALENT_BY_ID } from "../game/content/talents";
import { OUTCOME_LABELS, OUTCOME_WEIGHTS, idleDrain } from "../game/config";
import { clockLabel, stepDuration } from "../game/timeline";
import { hasAffordable, preview, visibleIndexes } from "../game/engine";
import { pick } from "../game/rng";
import { summarize } from "../game/scoring";
import { envSummary } from "../game/world";
import { useTypewriter } from "./useTypewriter";
import DecisionControls, { type DecisionView } from "./DecisionControls";
import StageScene from "./StageScene";
import type { OutcomeId, Session } from "../game/types";

const money = (n: number) => `${(n / 1000).toFixed(3)}%`;

export default function EventScreen({
  session: s, onChoose, onDrain, onAbandon, instant, onToggleInstant,
}: {
  session: Session; onChoose: (index: number) => void; onDrain: () => void;
  onAbandon: () => void; instant: boolean; onToggleInstant: () => void;
}) {
  const w = s.world;
  const q = QUESTION_BY_ID[w.questions[s.step]];
  const persona = PERSONA_BY_ID[s.ghostPersona];
  const text = q ? pick(w.seed, `prompt:${q.id}`, q.prompt) : "";
  const typed = useTypewriter(text, 30, instant);
  const me = summarize(s.player);
  const ghost = summarize(s.ghost);
  const last = s.player.answers.at(-1);
  const [confirming, setConfirming] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [view, setView] = useState<DecisionView>("action");
  const submitted = useRef(false);
  const main = useRef<HTMLElement>(null);
  const duration = stepDuration(w, s.step);
  const idle = idleDrain(w.env, duration);
  const minutes = last?.minutes ?? 0;
  const options = q ? visibleIndexes(w, q).map((index) => ({
    index, option: q.options[index], p: preview(w, s.player, q, index),
  })) : [];
  const stuck = q ? !hasAffordable(w, s.player, q) : false;
  const chosen = options.find((o) => o.index === selected);
  const select = (index: number) => {
    setSelected(index);
    main.current?.focus({ preventScroll: true });
  };

  // 每步由父组件使用 key 重建，选择与提交锁不跨步骤继承。
  useEffect(() => { main.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => {
    main.current?.querySelector('.choice-card.selected, .drain-choice.selected')?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [selected]);
  const confirm = () => {
    if (confirming || view !== "action" || submitted.current) return;
    if (!typed.done) { typed.skip(); return; }
    if (selected === -1 && stuck) { submitted.current = true; onDrain(); }
    else if (chosen?.p.affordable) { submitted.current = true; onChoose(chosen.index); }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return;
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable=true]")) return;
      if (e.repeat && /^(Enter| |[1-9])$/.test(e.key)) { e.preventDefault(); return; }
      if (confirming) {
        if (e.key === "Escape") { e.preventDefault(); setConfirming(false); }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault(); setView("action"); setSelected(null); return;
      }
      if (view !== "action") return;
      if (e.key === "Enter" && !typed.done) { e.preventDefault(); typed.skip(); return; }
      const n = Number(e.key);
      if (/^[1-9]$/.test(e.key)) {
        const picked = options[n - 1];
        if (picked?.p.affordable) { e.preventDefault(); select(picked.index); }
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const enabled = options.filter((o) => o.p.affordable);
        if (!enabled.length) return;
        e.preventDefault();
        const at = enabled.findIndex((o) => o.index === selected);
        const next = at < 0 ? (e.key === "ArrowDown" ? 0 : enabled.length - 1)
          : (at + (e.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length;
        setSelected(enabled[next].index);
        main.current?.focus({ preventScroll: true });
      }
      // 已聚焦按钮保留原生 Enter 行为；仅非按钮焦点把 Enter 当作确认。
      if (e.key === "Enter" && !target.closest("button, summary, a")) {
        e.preventDefault(); confirm();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!q) return null;
  const stage = q.stage === "early" ? "01 / 处境" : q.stage === "mid" ? "02 / 送出" : "03 / 余量";
  return (
    <main className="game-screen terminal-screen" ref={main} tabIndex={-1} aria-label="资源决策终端">
      <div className="game-heading">
        <div className="run-heading"><span className="terminal-cross" aria-hidden="true">＋</span>
          <span className="eyebrow">{w.preset ? `固定案例 ${w.preset}` : "随机人生"} <span className="seed">#{w.seed}</span></span>
          <span className="step-label" data-testid="step-label">第 {s.step + 1} 步</span>
        </div>
        <div className="run-tools">
          <span className="pause-note"><i /> 阅读与思考不耗电</span>
          <button className="give-up-button" onClick={() => setConfirming((v) => !v)} data-testid="abandon">
            {confirming ? "再想想" : "放弃这一局"}
          </button>
        </div>
      </div>
      {confirming && (
        <div className="give-up-box" role="alert">
          <span>放弃后本局不计入记录，确定要重开吗？</span>
          <button className="danger" onClick={onAbandon}>确定放弃并重开</button>
          <button className="text-button" onClick={() => setConfirming(false)}>继续这一局</button>
        </div>
      )}
      <div className="game-columns">
        <section className="event-panel panel">
          <div className="scene-heading"><span>最后的余量 <small> / THE LAST RESERVE</small></span><span>{stage}</span></div>
          <StageScene env={w.env} />
          <div className="env-strip" aria-label="当前已知环境">
            {envSummary(w.env).map((line) => {
              const [k, v] = line.split(" ");
              return <span key={k} className="env-chip"><small>{k}</small><b>{v}</b></span>;
            })}
          </div>
          <div className="narrative-box">
            <div className="narrator"><span className="tiny-line" /><b>你</b><span>当前处境</span>
              <button className="type-mode" onClick={onToggleInstant}
                aria-label={instant ? "恢复逐字剧情" : "立即显示剧情"}>{instant ? "逐字 ○" : "逐字 ●"}</button>
            </div>
            <p className={"event-story" + (typed.done ? "" : " typing")} onClick={typed.skip}>
              <time className="story-clock" data-testid="story-clock">{clockLabel(w, minutes)}</time>{" "}
              <span aria-hidden="true">{typed.shown}{!typed.done && <span className="caret" />}</span>
              <span className="sr-only">{text}</span>
            </p>
            <button className="skip-type" onClick={typed.skip} disabled={typed.done}>
              {typed.done ? "剧情已显示 · 请选择行动" : "点击正文或 Enter · 跳过这段 ▸"}
            </button>
          </div>

          {view === "action" && <div className="choices" aria-label="可选行动">
            <div className="choice-heading">做出你的决定 <span>点击选中，再点确认 · 1–4 / ↑↓ / Enter</span></div>
            {options.map(({ index, option, p }, i) => (
              <div key={index} className={`choice-card ${selected === index ? 'selected' : ''}`}>
              <button className={`choice ${selected === index ? "selected" : ""}`}
                disabled={!p.affordable} aria-pressed={selected === index} data-testid={`option-${i}`}
                onClick={(e) => { if(e.detail > 1) return; if(selected === index) confirm(); else select(index); }}>
                <span className="choice-index">{String(i + 1).padStart(2, "0")}</span>
                <span className="choice-body">
                  <strong>{option.label}</strong><small>{option.detail}</small>
                  <span className="choice-tags">
                    {p.gain && <em className="tag-gain">{OUTCOME_LABELS[p.gain.outcome]} +{p.gain.points}</em>}
                    {p.gamble && <em className="tag-risk">{OUTCOME_LABELS[p.gamble.outcome]} +{p.gamble.points} · {Math.round(p.gamble.odds * 100)}% 把握</em>}
                    {!p.gain && !p.gamble && <em className="tag-none">当前条件下没有成果收益</em>}
                  </span>
                </span>
                <span className="choice-cost"><b>{p.cost ? `−${money(p.cost)}` : "行动不耗电"}</b>
                  <small>{p.affordable ? `做完剩 ${money(Math.max(0, s.player.energy - p.cost - p.idle))}` : (p.reason ?? "电量不够")}</small></span>
                <span className="choice-arrow" aria-hidden="true">{selected === index ? "✓" : "+"}</span>
              </button>
              {selected === index && <button className="choice-confirm" data-testid="confirm-action" disabled={confirming}
                onClick={(e) => { if(e.detail <= 1) confirm(); }}>
                <span>{typed.done ? '确认行动 · 再次点击选项亦可' : '显示完整剧情 · 再确认行动'}</span><b aria-hidden="true">↵</b>
              </button>}
              </div>
            ))}
            {stuck && <button className={`choice drain-choice ${selected === -1 ? "selected" : ""}`}
              aria-pressed={selected === -1} onClick={() => select(-1)}>
              <span className="choice-index">!!</span><span className="choice-body"><strong>攥着手机，什么都做不了了</strong>
                <small>剩余电量无法完成任何行动。合上手机，等待本局结果。</small></span>
            </button>}
            {stuck && selected === -1 && <button className="choice-confirm" data-testid="confirm-action" disabled={confirming} onClick={(e) => {if(e.detail <= 1) confirm();}}>合上手机，等待结果</button>}
            <p className="cost-note">行动耗电已含环境与策略修正；本步推进 {duration} 分钟，自然损耗 {money(idle)}。收益会随环境变化。</p>
          </div>}

          {view === "intel" && <section className="terminal-subpanel" data-testid="intel-panel" aria-label="已知信息">
            <div className="choice-heading">当前已知信息 <span>信息不会推进游戏时间</span></div>
            <h3>先看清处境，再决定这点电怎么用。</h3>
            <dl className="intel-grid">{envSummary(w.env).map((line) => {
              const [k, v] = line.split(" "); return <div key={k}><dt>{k}</dt><dd>{v}</dd></div>;
            })}</dl>
            <p><b>本局策略：</b>{s.player.talent ? TALENT_BY_ID[s.player.talent]?.name : "—"}。{s.player.talent ? TALENT_BY_ID[s.player.talent]?.note : ""}</p>
            <p>本次确认行动推进 {duration} 分钟，另有 {money(idle)} 自然损耗。阅读、切换面板、思考都不推进时间。</p>
            <details className="journal"><summary>本局规则</summary><p>一局 8–12 步，剩余步数未知。行动耗电由环境、策略共同决定；收益也可能受环境与赌运影响。你与 Ghost 共享题目、时间表和赌运，双方各自使用自己的策略。评分的隐藏因素在结算时揭晓，所有数据都是模拟参数。</p></details>
          </section>}
          {view === "log" && <section className="terminal-subpanel" data-testid="log-panel" aria-label="行动记录">
            <div className="choice-heading">你的行动记录 <span>已完成 {s.player.answers.length} 步</span></div>
            {!s.player.answers.length ? <p className="empty-log"><span>—</span>还没有行动记录。每次确认后，结果会保存在这里。</p> :
              <ol className="log-list">{s.player.answers.map((l, i) => <li key={i}>
                <span className="log-idx">{String(i + 1).padStart(2, "0")}</span><div>
                  <strong>{l.label}</strong><span className="log-cost"> −{money(l.cost)}</span><p>{l.note}</p>
                  <small>自然损耗 {money(l.idleDrain)} · 行动后余量 {money(Math.max(0, l.energyAfter - l.idleDrain))} · {l.minutes} 分钟</small>
                </div></li>)}</ol>}
          </section>}
        </section>

        <aside className="game-aside">
          <div className="ghost-card panel">
            <div className="panel-kicker"><span className="ghost-dot" /> GHOST / 世界镜像</div>
            <div className="ghost-emblem" aria-hidden="true"><span>G</span><i /><i /><i /></div>
            <div className="ghost-identity"><small>本局行为习惯</small><h2>{persona?.name ?? "另一个你"}</h2></div>
            <p className="ghost-persona">{persona?.note}</p>
            <p className="ghost-strategy">策略 / {TALENT_BY_ID[w.ghostTalent]?.name}</p>
            <div className="ghost-stats"><div><small>剩余电量</small><strong>{money(s.ghost.energy)}</strong></div>
              <div><small>成果价值</small><strong>{ghost.value}</strong></div></div>
            <div className="ghost-meter"><i style={{ width: `${s.ghost.energy / 10}%` }} /></div>
            <div className="ghost-foot"><span className="ghost-dot" /> 已同步 {s.ghost.answers.length} 步</div>
            <p className="ghost-disclaimer">同一起点，另一种习惯。<br />它的下一步，仍未揭晓。</p>
          </div>
          <div className="last-action panel" aria-live="polite">
            <span className="eyebrow">LAST TRANSMISSION / 行动回声</span>
            {last ? <><h3>{last.label}</h3><p>{last.note}</p>
              <div className="last-cost"><span>行动 −{money(last.cost)}</span><span>自然 −{money(last.idleDrain)}</span></div>
              <small>{clockLabel(w, last.minutes)} · 行动已记录</small></> :
              <><h3>一份电量，两种人生。</h3><p>你还没有行动。选项会告诉你代价，结果要由你亲手换来。</p></>}
          </div>
          <div className="aside-foot"><span>模拟实验 / DECISION SIMULATION</span><span>你的时间，由你的决定推进。</span></div>
        </aside>
      </div>
      <div className="decision-dock">
        <div className={"resource-bar" + (s.player.energy === 0 ? " battery-off" : "")}>
          <div className="battery-stat"><span className="stat-label">{s.player.energy === 0 ? "设备已关机" : "最后 1% 的余量"}</span>
            <strong data-testid="battery">{money(s.player.energy)}<small> / 1.000%</small></strong>
            <div className="energy-track"><i style={{ width: `${s.player.energy / 10}%` }} /></div></div>
          <div><span className="stat-label">成果价值</span><strong data-testid="value">{me.value}<small> / 12</small></strong>
            <div className="outcome-dots">{(Object.keys(OUTCOME_WEIGHTS) as OutcomeId[]).map((k) =>
              <i key={k} className={s.player.delivered[k] ? "on" : ""} title={OUTCOME_LABELS[k]} />)}</div></div>
          <div className="selected-preview"><span className="stat-label">本步预算 · 含自然损耗</span>
            <strong>{chosen ? `−${money(chosen.p.cost + chosen.p.idle)}` : "等待选择"}</strong>
            <small>自然损耗 {money(idle)} / 步</small></div>
        </div>
        <DecisionControls view={view} onView={setView} />
      </div>
    </main>
  );
}
