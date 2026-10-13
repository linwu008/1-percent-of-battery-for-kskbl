import StageScene from './StageScene';

export default function EntryScreen({ onEnter }: { onEnter: () => void }) {
  return <main className="entry-screen">
    <div className="entry-grid" aria-hidden="true" />
    <div className="entry-top"><span>RESOURCE PRESSURE / 001</span><span>本地模拟 · 无需登录</span></div>
    <div className="entry-radar" aria-hidden="true"><i /><b /></div>
    <div className="entry-main">
      <span className="entry-overline">THE LAST RESERVE</span>
      <div className="entry-emblem" aria-hidden="true">1<span>%</span></div>
      <h1>最后的余量</h1>
      <p>同一个世界。你的另一种可能。</p>
      <button className="entry-enter" onClick={onEnter} aria-label="进入模拟器"><span>进入模拟器</span><b aria-hidden="true">→</b></button>
      <small>ONE PERCENT BATTERY / v0.7.0</small>
    </div>
    <div className="entry-scene" aria-hidden="true"><StageScene hero /></div>
    <div className="entry-bottom"><span>一份电量，两种人生。</span><span>模拟能耗与概率 · 非真实救援工具</span></div>
  </main>;
}
