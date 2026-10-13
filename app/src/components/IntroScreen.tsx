import { useEffect, useMemo } from 'react';
import { backdrop } from '../game/content/backdrop';
import { envSummary } from '../game/world';
import { useTypewriterAll } from './useTypewriter';
import type { Session } from '../game/types';

export default function IntroScreen({session:s, instant, onToggleInstant, onContinue}: {
  session:Session; instant:boolean; onToggleInstant:()=>void; onContinue:()=>void;
}) {
  const lines=useMemo(()=>backdrop(s.world.seed,s.world.env),[s.world.seed,s.world.env]);
  const typed=useTypewriterAll(lines,30,instant);
  useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[]);
  return <main className="intro-screen page-reveal">
    <div className="brief-head"><span className="eyebrow">PROLOGUE / 序章 <span className="seed">#{s.world.seed}</span></span>
      <h1>醒来以后，<span className="mint">还剩 1%。</span></h1></div>
    <section className="panel backdrop-card" onClick={typed.done?undefined:typed.skip}>
      <div className="panel-kicker"><span className="tiny-line"/>你现在所处的处境
        <button className="type-mode" onClick={e=>{e.stopPropagation();onToggleInstant();}} aria-label={instant?'恢复逐字剧情':'立即显示剧情'}>{instant?'逐字 ○':'逐字 ●'}</button></div>
      {lines.map((line,i)=><p key={i} className={'backdrop-line'+(i===typed.stage&&!typed.done?' typing':'')}>
        {i<typed.stage?line:i===typed.stage?typed.shown:''}{i===typed.stage&&!typed.done&&<span className="caret" aria-hidden="true"/>}</p>)}
      {!typed.done&&<button className="skip-type" onClick={typed.skip}>跳过这段 ▸</button>}
    </section>
    <section className="intro-world"><h2>这一局的世界</h2><div className="env-chips">{envSummary(s.world.env).map(line=>{
      const [k,v]=line.split(' ');return <span className="env-chip" key={k}><small>{k}</small><b>{v}</b></span>;
    })}</div><p>每次决定推进 25–35 分钟。你手里只有 1.000% 电量。</p></section>
    <div className="intro-actions"><button className="primary" disabled={!typed.done} onClick={onContinue}>继续 · 选择策略</button></div>
  </main>;
}
