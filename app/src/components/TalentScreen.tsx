import { useEffect, useState } from "react";
import { TALENT_BY_ID } from "../game/content/talents";
import { PERSONA_BY_ID } from "../game/content/personas";
import type { Session } from "../game/types";

export default function TalentScreen({
  session: s,
  onPick,
}: {
  session: Session;
  onPick: (talentId: string) => void;
}) {
  const persona = PERSONA_BY_ID[s.ghostPersona];
  const [selected, setSelected] = useState<string | null>(null);
  const strategy = selected ? TALENT_BY_ID[selected] : null;
  const ghostStrategy = TALENT_BY_ID[s.world.ghostTalent];
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);

  return (
    <main className="talent-screen strategy-screen page-reveal">
      <div className="brief-head">
        <span className="eyebrow">
          {s.world.preset ? `固定案例 ${s.world.preset}` : "新的随机人生"}{" "}
          <span className="seed">#{s.world.seed}</span>
        </span>
      </div>

      <section className="talent-pick">
        <div className="strategy-heading"><span className="eyebrow">SELECT YOUR PROTOCOL</span><h2>请选择策略</h2><p>先选名称查看作用，确认后本局生效。</p></div>
        <div className="talent-cards">
          {s.world.talentChoices.map((id) => {
            const t = TALENT_BY_ID[id];
            if (!t) return null;
            return (
              <button key={id} className={`talent-card ${selected === id ? 'selected' : ''}`} aria-pressed={selected === id} onClick={() => setSelected(current => current === id ? null : id)}>
                <span className="talent-name">{t.name}</span>
                <span className="strategy-mark" aria-hidden="true">{selected === id ? '✓' : '+'}</span>
              </button>
            );
          })}
        </div>
        {strategy && <div className="strategy-detail" key={selected} aria-live="polite"><div><span className="eyebrow">STRATEGY EFFECT / 策略作用</span><h3>{strategy.name}</h3><p>{strategy.note}</p></div><button className="primary" onClick={() => onPick(strategy.id)}>确认选择</button></div>}
      </section>

      <div className="brief-grid strategy-ghost">
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
