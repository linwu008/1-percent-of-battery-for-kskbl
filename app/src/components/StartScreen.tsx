import type { Profile } from "../game/types";
interface Props {
  profile: Profile;
  hasSession: boolean;
  onBegin: (preset?: "A" | "B") => void;
  onContinue: () => void;
  onReset: () => void;
}
export default function StartScreen({
  profile,
  hasSession,
  onBegin,
  onContinue,
  onReset,
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
            地震之后，灯光熄灭。
            <br />
            你的手机，还有最后一点电。
          </p>
          <p className="muted hero-description">
            每一次发送、等待和亮屏，都在改变下一步。
            <br />
            与你的镜像一起走到最后，看看这一点余量能走多远。
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
            <span>◇ 4–6 次关键选择</span>
            <span>Ⅱ 思考时暂停</span>
          </div>
        </div>
        <div
          className="mirror-art"
          aria-label="你与Ghost共享一份起点，选择不同的路线"
        >
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
            <span className="ghost-dot" /> MEET YOUR GHOST{" "}
            <span>V{profile.ghostVersion}</span>
          </div>
          <h2>
            它不是最优解。
            <br />
            它是习惯先行动的你。
          </h2>
          <p>
            有消息就发送，有事情就处理。它可能多耗一点电，也可能比你先抓住机会。
          </p>
          <div className="ghost-policy">
            {profile.ghostVersion === 1
              ? "当前习惯：及时发送 · 持续光信号 · 快速展示"
              : "已经成长：视线清楚时，使用短光信号"}
          </div>
          {profile.ghostVersion > 1 && (
            <button className="text-button" onClick={onReset}>
              重置为初始 Ghost
            </button>
          )}
          <small>成长由你同意，并从下一局生效。</small>
        </div>
        <div className="demo-intro">
          <div className="eyebrow">QUICK EXPLORATION</div>
          <h2>也可以，从同一个起点试试。</h2>
          <p className="muted">固定环境，方便演示与比较。你的选择仍然自由。</p>
          <button className="demo-button" onClick={() => onBegin("A")}>
            <span>
              <strong>案例 A · 留下余量</strong>
              <small>一次合并，能为后来留下什么？</small>
            </span>
            <span>↗</span>
          </button>
          <button className="demo-button" onClick={() => onBegin("B")}>
            <span>
              <strong>案例 B · 抓住窗口</strong>
              <small>当信号变差，等待意味着什么？</small>
            </span>
            <span>↗</span>
          </button>
        </div>
      </section>
    </main>
  );
}
