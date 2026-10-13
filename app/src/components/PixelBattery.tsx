export default function PixelBattery({energy}:{energy:number}) {
  const filled=Math.ceil(Math.max(0,Math.min(1000,energy))/50);
  return <div className={'pixel-battery'+(energy<=200?' low':'')} role="img" aria-label={`最后百分之一的剩余预算 ${(Math.max(0,energy)/10).toFixed(1)}%`}>
    <div className="pixel-battery-cap" aria-hidden="true"/>
    <div className="pixel-battery-body" aria-hidden="true">{Array.from({length:20},(_,i)=><i key={i} className={'pixel-cell'+(19-i<filled?' lit':'')}/>)}</div>
  </div>;
}
