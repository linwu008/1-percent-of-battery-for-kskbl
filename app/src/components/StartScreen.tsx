import type { Profile } from "../game/types";
import StageScene from "./StageScene";

interface Props {
  profile: Profile;
  hasSession: boolean;
  onBegin: (preset?: "A" | "B") => void;
  onContinue: () => void;
  onCatalog: () => void;
}

export default function StartScreen({
  profile,
  hasSession,
  onBegin,
  onContinue,
  onCatalog,
}: Props) {
  return (
    <main className="start-screen">
      <div className="lobby-heading"><span className="eyebrow">SIMULATION TERMINAL</span><span>选择一次，改变余下的每一步。</span></div>
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
          <div className="hero-actions catalog-actions">
            <button className="primary protocol-action" onClick={() => onBegin()}>
              开启一段人生 <span className="action-arrow">↗</span>
            </button>
            <button className="protocol-action catalog-action" onClick={onCatalog}>变量目录 <span className="action-arrow">↗</span></button>
            {hasSession && (
              <button className="text-button continue-action" onClick={onContinue}>
                继续上次记录 →
              </button>
            )}
          </div>
        </div>
        <div
          className="mirror-art"
          aria-label="你与 Ghost 共享一份起点，选择不同的路线"
        >
          <StageScene hero />
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
          <span className="art-footnote">SAME WORLD. DIFFERENT CHOICES.</span>
        </div>
      </section>

      <section className="start-bottom">
        <aside className="how-to panel"><h2>玩法说明</h2><p>选择策略，判断每次行动的代价。<br/>让最后的电量，换来更多生存机会。</p></aside>
        <aside className="ghost-intro panel"><div className="panel-kicker"><span className="ghost-dot"/> GHOST / 世界镜像</div>
          <h2>同一起点，另一种习惯。</h2><p>它按自己的习惯行动，与你共享环境与题目。结算时，两种选择留下的差距会被看见。</p></aside>
        <div className="demo-intro">
          <div className="eyebrow">QUICK EXPLORATION</div>
          <h2>固定案例</h2>
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
              已体验 {profile.completed.length} 个世界，跨版本历史最高模拟存活概率{" "}
              {(profile.best * 100).toFixed(1)}%。
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
