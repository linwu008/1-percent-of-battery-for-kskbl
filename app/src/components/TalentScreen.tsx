import { useMemo } from "react";
import { TALENT_BY_ID } from "../game/content/talents";
import { PERSONA_BY_ID } from "../game/content/personas";
import { backdrop } from "../game/content/backdrop";
import { MIN_ROUNDS, MAX_ROUNDS, STEP_MINUTES, idleDrain } from "../game/config";
import { envSummary } from "../game/world";
import { useTypewriterAll } from "./useTypewriter";
import type { Session } from "../game/types";

export default function TalentScreen({
  session: s,
  onPick,
}: {
  session: Session;
  onPick: (talentId: string) => void;
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
  const typed = useTypewriterAll(lines, 22);
  const idle = idleDrain(s.world.env);

  return (
    <main className="talent-screen">
      <div className="brief-head">
        <span className="eyebrow">
          {s.world.preset ? `固定案例 ${s.world.preset}` : "新的随机人生"}{" "}
          <span className="seed">#{s.world.seed}</span>
        </span>
        <h1>在按下第一次亮屏之前，你先看清自己在哪儿。</h1>
      </div>

      <section
        className="panel backdrop-card"
        onClick={typed.done ? undefined : typed.skip}
      >
        <div className="panel-kicker">
          <span className="tiny-line" /> 你现在所处的处境
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
            每一个决定推进 {STEP_MINUTES} 分钟。就算你什么都不做，这 {STEP_MINUTES}{" "}
            分钟里电池也会自己掉 {idle} 格（本局环境温度下）；一共有 {MIN_ROUNDS}~
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
          <small className="muted">
            它和你抽到同一批题，赌运也一样。差别只来自性格决定的花法。
          </small>
        </section>
      </div>

      <section className="talent-pick">
        <div className="choice-heading">
          开局天赋 · 三选一 <span>本局只给这三个，选了就不能改</span>
        </div>
        <div className="talent-cards">
          {s.world.talentChoices.map((id) => {
            const t = TALENT_BY_ID[id];
            if (!t) return null;
            return (
              <button key={id} className="talent-card" onClick={() => onPick(id)}>
                <span className="talent-name">{t.name}</span>
                <span className="talent-note">{t.note}</span>
                <span className="talent-go">用这个开局 ↗</span>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
