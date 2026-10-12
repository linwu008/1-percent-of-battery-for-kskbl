import { RULE_VERSION } from './config';
import type { World } from './types';
export function createWorld(seed:string,preset?:'A'|'B'):World {
 if(!seed || seed.length>128) throw new Error('无效的世界编号');
 if(preset==='A') return {seed,preset,version:RULE_VERSION,firstClose:45,firstHint:'stable',visibility:'clear',secondClose:145};
 if(preset==='B') return {seed,preset,version:RULE_VERSION,firstClose:15,firstHint:'fading',visibility:'obstructed',secondClose:125};
 let hash=2166136261;
 for(const char of seed) hash=Math.imul(hash^char.charCodeAt(0),16777619);
 const draw=()=>{hash^=hash<<13;hash^=hash>>>17;hash^=hash<<5;return (hash>>>0)/4294967296;};
 const firstHint=draw()<.5?'stable':'fading';
 const firstClose=(firstHint==='stable'?[32,45,55]:[15,25,40])[Math.floor(draw()*3)];
 return {seed,version:RULE_VERSION,firstHint,firstClose,visibility:draw()<.5?'clear':'obstructed',secondClose:draw()<.5?125:145};
}
