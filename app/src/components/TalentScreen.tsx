import { useEffect, useMemo, useState } from "react";
import { TALENT_BY_ID } from "../game/content/talents";
import { PERSONA_BY_ID } from "../game/content/personas";
import { backdrop } from "../game/content/backdrop";
import { MIN_ROUNDS, MAX_ROUNDS } from "../game/config";
import { envSummary } from "../game/world";
import { useTypewriterAll } from "./useTypewriter";
import type { Session } from "../game/types";

export default function TalentScreen({
  session: s,
  onPick,
  instant,
  onToggleInstant,
}: {
  session: Session;
  onPick: (talentId: string) => void;
  instant: boolean;
  onToggleInstant: () => void;
}) {
  const persona = PERSONA_BY_ID[s.ghostPersona];
  const chips = envSummary(s.world.env).map((line) => {
    const [k, v] = line.split(" ");
    return { k, v };
  });
  const lines = useMemo(() => backdrop(s.world.seed, s.world.env), [
    s.world.seed,
    s.world.env,
  ]);
  const typed = useTypewriterAll(lines, 30, instant);
  const [selected, setSelected] = useState<string | null>(null);
  const strategy = selected ? TALENT_BY_ID[selected] : null;
  const ghostStrategy = TALENT_BY_ID[s.world.ghostTalent];
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);

  return (
    <main className="talent-screen">
      <div className="brief-head">
        <span className="eyebrow">
          {s.world.preset ? `固定案例 ${s.world.preset}` : "新的随机人生"}{" "}
          <span className="seed">#{s.world.seed}</span>
        </span>
        <h1>醒来以后，<span className="mint">还剩 1%。</span></h1>
        <p className="muted">先看清处境，再决定你要用什么策略出发。</p>
      </div>

      <section className="talent-pick">
        <div className="strategy-heading"><span className="eyebrow">SELECT YOUR PROTOCOL</span><h2>请选择策略</h2><p>先选名称查看作用，确认后本局生效。</p></div>
        <div className="talent-cards">
          {s.world.talentChoices.map((id) => {
            const t = TALENT_BY_ID[id];
            if (!t) return null;
            return (
              <button key={id} className={`talent-card ${selected === id ? 'selected' : ''}`} aria-pressed={selected === id} onClick={() => setSelected(id)}>
                <span className="talent-name">{t.name}</span>
                <span className="strategy-mark" aria-hidden="true">{selected === id ? '✓' : '+'}</span>
              </button>
            );
          })}
        </div>
        {strategy && <div className="strategy-detail" key={selected} aria-live="polite"><div><span className="eyebrow">STRATEGY EFFECT / 策略作用</span><h3>{strategy.name}</h3><p>{strategy.note}</p></div><button className="primary" onClick={() => onPick(strategy.id)}>确认选择</button></div>}
      </section>

      <section
        className="panel backdrop-card"
        onClick={typed.done ? undefined : typed.skip}
      >
        <div className="panel-kicker">
          <span className="tiny-line" /> 你现在所处的处境
          <button className="type-mode" onClick={(e) => { e.stopPropagation(); onToggleInstant(); }} aria-label={instant ? "恢复逐字剧情" : "立即显示剧情"}>{instant ? "逐字 ○" : "逐字 ●"}</button>
        </div>
        {lines.map((line, i) => (
          <p
            key={i}
            className={
              "backdrop-line" + (i === typed.stage && !typed.done ? " typing" : "")
            }
          >
            {i < typed.stage ? line : i === typed.stage ? typed.shown : ""}
            {i === typed.stage && !typed.done && (
              <span className="caret" aria-hidden="true" />
            )}
          </p>
        ))}
        {!typed.done && (
          <button className="skip-type" onClick={typed.skip}>
            跳过这段 ▸
          </button>
        )}
        {typed.done && (
          <p className="backdrop-rule">
            每一个决定推进 25–35 分钟，时钟会在剧情框里向前走。电池自然损耗随时长和环境变化；一共有 {MIN_ROUNDS}~
            {MAX_ROUNDS} 步，具体几步，你事先不会知道。
          </p>
        )}
      </section>

      <div className="brief-grid">
        <section className="panel brief-card">
          <div className="panel-kicker">
            <span className="tiny-line" /> 这一局的世界
          </div>
          <div className="env-chips">
            {chips.map((c) => (
              <span key={c.k} className="env-chip">
                <small>{c.k}</small>
                <b>{c.v}</b>
              </span>
            ))}
          </div>
          <p className="muted">
            环境会改写同一个选择的实际耗电与收益。它值不值，选完之后你才会知道——
            所以别只看标价。
          </p>
        </section>

        <section className="panel brief-card">
          <div className="panel-kicker">
            <span className="ghost-dot" /> 这一局的 GHOST
          </div>
          <h2>{persona?.name ?? "另一个你"}</h2>
          <p>{persona?.note}</p>
          <p className="ghost-strategy" data-testid="ghost-strategy">自动选择策略 · <b>{ghostStrategy?.name}</b><small>{ghostStrategy?.note}</small></p>
          <small className="muted">
            它和你抽到同一批题，赌运也一样；行动习惯与各自策略带来不同结果。
          </small>
        </section>
      </div>


    </main>
  );
}
