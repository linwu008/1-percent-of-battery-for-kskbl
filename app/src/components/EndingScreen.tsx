import type { Session } from "../game/types";
export default function EndingScreen({
  session: s,
  onFinish,
}: {
  session: Session;
  onFinish: (x: "relay" | "check") => void;
}) {
  return (
    <main className="ending-screen">
      <span className="eyebrow">AFTER THE LAST PERCENT</span>
      <div className="ending-symbol">◌</div>
      <h1>
        电量之外，
        <br />
        有些事情还在继续。
      </h1>
      <p>
        {s.player.delivered.ack
          ? "你的确认已经传到对方手里，这条联系留了下来。"
          : s.player.delivered.position
            ? "你的位置已经传了出去。接下来仍有不确定，但这一条信息没有消失。"
            : "通信没有留下位置信息。你仍然和同行者待在一起，核对彼此掌握的情况。"}
      </p>
      <p className="muted">
        {s.player.briefed
          ? s.player.paper
            ? "纸条还在同行者手里。手机关机，也不会让这份安排消失。"
            : "同行者已经听到了安排，不需要再次点亮屏幕。"
          : "尚未传达的安排，不能当作大家都已经知道。"}
      </p>
      <div className="ending-options">
        {s.player.briefed && (
          <button className="primary" onClick={() => onFinish("relay")}>
            根据已有安排，照应同行者
          </button>
        )}
        <button className="secondary" onClick={() => onFinish("check")}>
          先核对大家手中的信息
        </button>
      </div>
      <small>这一段不额外加分。留下来的，是先前选择已经产生的作用。</small>
      <span data-testid="game-time" data-time="160" hidden />
    </main>
  );
}
