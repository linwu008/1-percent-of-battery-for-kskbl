import { QUESTIONS } from "../game/content/questions";
import { TALENTS } from "../game/content/talents";
import { PERSONAS } from "../game/content/personas";
import { MAX_ROUNDS, MIN_ROUNDS } from "../game/config";
import type { Profile } from "../game/types";
import StageScene from "./StageScene";

interface Props {
  profile: Profile;
  hasSession: boolean;
  onBegin: (preset?: "A" | "B") => void;
  onContinue: () => void;
}

export default function StartScreen({
  profile,
  hasSession,
  onBegin,
  onContinue,
}: Props) {
  return (
    <main className="start-screen">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="tiny-line" /> THE LAST ONE PERCENT
          </div>
          <h1>
            如果只剩
            <span className="hero-number">
              1<span>%</span>
              <i />
            </span>
            你会如何使用？
          </h1>
          <p className="hero-intro">
            灾后的废墟里，你摸出手机。
            <br />
            屏幕上写着：1%。
          </p>
          <p className="muted hero-description">
            每一步都会烧这一格电，每一步固定推进 15 分钟——不操作，电池也在掉。
            <br />
            同一个世界里，还有一个和你抽到同一批题的 Ghost。它按自己的习惯使用这点电。
          </p>
          <div className="hero-actions">
            <button className="primary" onClick={() => onBegin()}>
              开始一段人生 <span>↗</span>
            </button>
            {hasSession && (
              <button className="text-button" onClick={onContinue}>
                继续上次记录 →
              </button>
            )}
          </div>
          <div className="hero-facts">
            <span>◷ 3–5 分钟</span>
            <span>◇ 每局 {MIN_ROUNDS}–{MAX_ROUNDS} 步</span>
            <span>◈ 题库 {QUESTIONS.length} 道 · 每次随机抽</span>
          </div>
        </div>
        <div
          className="mirror-art"
          aria-label="你与 Ghost 共享一份起点，选择不同的路线"
        >
          <StageScene hero />
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />
          <div className="battery-object">
            <div className="battery-cap" />
            <div className="battery-frame">
              <span className="battery-percent">
                1<span>%</span>
              </span>
              <div className="battery-last" />
              <span className="battery-caption">ENOUGH TO MATTER.</span>
            </div>
          </div>
          <div className="art-label you">
            <span className="live-dot" /> YOU <small>由你决定</small>
          </div>
          <div className="art-label ghost">
            <span className="ghost-dot" /> GHOST <small>另一个你</small>
          </div>
          <span className="art-footnote">SAME WORLD. DIFFERENT CHOICES.</span>
        </div>
      </section>

      <section className="start-bottom">
        <div className="ghost-intro panel">
          <div className="panel-kicker">
            <span className="ghost-dot" /> MEET YOUR GHOST
          </div>
          <h2>
            同一个世界。
            <br />
            另一种使用余量的习惯。
          </h2>
          <p>
            每局随机生成一种性格，共 {PERSONAS.length} 种：有人见事就办，有人一格电
            掰成两半用，有人专挑没把握的那个。
          </p>
          <details className="persona-details"><summary>查看 {PERSONAS.length} 种 Ghost 习惯</summary><ul className="persona-list">
            {PERSONAS.map((p) => (
              <li key={p.id}>
                <b>{p.name}</b>
                <span>{p.note}</span>
              </li>
            ))}
          </ul></details>
          <small>它和你共享题目与赌运，各自使用自己的天赋。Ghost 不是最优解。</small>
        </div>

        <div className="demo-intro">
          <div className="eyebrow">QUICK EXPLORATION</div>
          <h2>也可以，从同一个起点试试。</h2>
          <p className="muted">
            固定环境与题目，方便演示和比较。开局还会随机给 {TALENTS.length}{" "}
            个天赋中的三个，由你选一个。
          </p>
          <button className="demo-button" onClick={() => onBegin("A")}>
            <span>
              <strong>案例 A · 局部有网</strong>
              <small>深夜，有纸笔，轻伤。手上这点电够做几件事？</small>
            </span>
            <span>↗</span>
          </button>
          <button className="demo-button" onClick={() => onBegin("B")}>
            <span>
              <strong>案例 B · 彻底断网</strong>
              <small>白天，严寒，持续失血，两手空空。这一次该怎么花？</small>
            </span>
            <span>↗</span>
          </button>
          {profile.completed.length > 0 && (
            <p className="muted small-note">
              已体验 {profile.completed.length} 个世界，历史最高模拟存活概率{" "}
              {(profile.best * 100).toFixed(1)}%。
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
