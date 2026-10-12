import { END_TIME, INITIAL_ENERGY, LABELS } from './config';
import type { Actor, Action, Choice, Item, World } from './types';

export function initialActor():Actor {return {time:0,energy:INITIAL_ENERGY,delivered:{position:false,people:false,ack:false},firstContact:false,light:0,lightUsed:false,briefed:false,paper:false,logs:[]};}
export function channelClose(w:World,t:number):number|null {return t<w.firstClose?w.firstClose:t>=110&&t<w.secondClose?w.secondClose:null;}
export function visibleContext(w:World,a:Actor):string {
 if(a.time<60) return channelClose(w,a.time)?(w.firstHint==='stable'?'信号当前稳定，后续仍可能中断':'信号正在变差，等待有风险'):'当前通信已中断';
 if(a.time<100) return a.time<80?(w.visibility==='clear'?'视线清楚，短光信号即可确认区域':'存在遮挡，短光只能引起注意'):'光信号机会已结束';
 if(a.time<110) return '安排已到达；110秒将出现回联机会，持续多久未知';
 return channelClose(w,a.time)?(w.secondClose===125?'回联信号正在变差':'回联信号当前稳定'):'本次通信机会已结束';
}
export function quote(action:Action):{cost:number;duration:number} {
 switch(action.kind){
  case 'send':return {cost:20+action.items.length*10,duration:5+action.items.length*5};
  case 'light':return {cost:10+action.duration,duration:action.duration};
  case 'brief':return action.method==='screen'?{cost:10,duration:5}:{cost:0,duration:20};
  case 'wait':return {cost:0,duration:0};
  default:throw new Error('未知行动');
 }
}
function validate(w:World,a:Actor,action:Action):void {
 if(a.time>=END_TIME) throw new Error('本局设备阶段已结束');
 if(action.kind==='wait'){
  if(!Number.isInteger(action.until)||action.until<=a.time||action.until>END_TIME)throw new Error('无效等待时间');
  return;
 }
 if(action.kind==='send'){
  if(!Array.isArray(action.items)||action.items.length<1||action.items.length>3||new Set(action.items).size!==action.items.length)throw new Error('无效信息列表');
  if(channelClose(w,a.time)===null)throw new Error('当前没有通信信号');
  for(const item of action.items){
   if(!['position','people','ack'].includes(item))throw new Error('未知信息');
   if(a.delivered[item])throw new Error('这项信息已经送达');
   if(item==='people'&&a.time<20)throw new Error('人数尚未确认');
   if(item==='ack'&&(!a.firstContact||a.time<110))throw new Error('尚未收到回联请求');
  }
 }else if(action.kind==='light'){
  if(![10,20].includes(action.duration))throw new Error('无效光信号时长');
  if(a.time<60||a.time>=80||a.lightUsed)throw new Error('当前没有新的光信号机会');
 }else if(action.kind==='brief'){
  if(!['paper','screen'].includes(action.method))throw new Error('无效传达方式');
  if(a.time<100||a.briefed)throw new Error('安排尚未到达或已经传达');
  if(a.time+quote(action).duration>END_TIME)throw new Error('剩余时间不足');
 }else throw new Error('未知行动');
 if(a.energy<quote(action).cost)throw new Error('剩余电量不足');
}
export function act(w:World,a:Actor,action:Action,horizon=END_TIME):Actor {
 validate(w,a,action);
 if(!Number.isInteger(horizon)||horizon<a.time||horizon>END_TIME)throw new Error('无效结算时间');
 if(horizon===a.time)return a;
 const next:Actor=structuredClone(a); const start=a.time;
 let end=start,cost=0,interrupted=false; const gained:string[]=[];
 let note='';
 if(action.kind==='wait'){
  const changes=[20,w.firstClose,60,80,100,110,w.secondClose,END_TIME].filter(t=>t>start&&t<=action.until);
  end=Math.min(action.until,horizon,...changes);note=end<action.until?'等待中情况发生变化':'等待结束';
 }else if(action.kind==='send'){
  const close=channelClose(w,start)!; const planned=start+quote(action).duration;
  end=Math.min(planned,close,horizon,END_TIME);const elapsed=end-start;
  cost=Math.round(Math.min(elapsed,5)*4+Math.max(0,elapsed-5)*2);
  const ordered=[...action.items].sort((x,y)=>['position','people','ack'].indexOf(x)-['position','people','ack'].indexOf(y));
  ordered.forEach((item,i)=>{
   if(elapsed>=10+i*5){next.delivered[item]=true;gained.push(LABELS[item]);if(item==='position'&&start<w.firstClose)next.firstContact=true;}
  });
  interrupted=end<planned;note=interrupted?(end===horizon&&end<close?'发送进行中':'信号中断；已送达内容保留'):'发送完成';
 }else if(action.kind==='light'){
  end=Math.min(start+action.duration,80,horizon);cost=10+end-start;const elapsed=end-start;
  next.lightUsed=true;
  next.light=elapsed>=20||elapsed>=10&&w.visibility==='clear'?2:elapsed>=10?1:0;
  if(next.light)gained.push(next.light===2?'光信号确认区域':'光信号引起注意');
  interrupted=end<start+action.duration;note=interrupted?'光信号时间已用尽或仍在进行':'光信号完成';
 }else if(action.kind==='brief'){
  const duration=quote(action).duration;end=Math.min(start+duration,horizon);
  cost=action.method==='screen'?5+(end-start):0;
  if(end-start>=duration){next.briefed=true;next.paper=action.method==='paper';gained.push('安排已传达');}
  interrupted=end<start+duration;note=interrupted?'正在传达安排':next.paper?'纸条已交给同行者':'同行者已经了解安排';
 }
 next.time=end;next.energy-=cost;
 next.logs.push({id:next.logs.length,action:structuredClone(action),start,end,cost,energyAfter:next.energy,gained,note,context:visibleContext(w,a),interrupted});
 return next;
}
export function choices(w:World,a:Actor):Choice[]{
 if(a.time>=END_TIME)return [];
 const all:Choice[]=[];
 const add=(title:string,detail:string,action:Action)=>{
  const q=quote(action);let disabled:string|undefined;
  try{validate(w,a,action);}catch(e){disabled=(e as Error).message;}
  all.push({title,detail,action,...q,disabled});
 };
 if(channelClose(w,a.time)!==null){
  const available:Item[]=[];
  if(!a.delivered.position)available.push('position');
  if(a.time>=20&&!a.delivered.people)available.push('people');
  if(a.time>=110&&a.firstContact&&!a.delivered.ack)available.push('ack');
  for(const item of available)add('发送'+({position:'位置',people:'人数',ack:'回联确认'}[item]),item==='ack'?'把已有联系变成明确确认':'先完成这一项，不等其他内容',{kind:'send',items:[item]});
  if(available.length>1)add('合并发送','只启动一次，逐项送达；中断可能只送达部分',{kind:'send',items:available});
 }
 if(a.time>=60&&a.time<80&&!a.lightUsed){
  add('短光信号','持续10秒；清楚时足够，遮挡时只能引起注意',{kind:'light',duration:10});
  add('持续光信号','持续20秒，争取让对方确认区域',{kind:'light',duration:20});
 }
 if(a.time>=100&&!a.briefed){
  add('亮屏展示安排','用少量电换取更快的传达',{kind:'brief',method:'screen'});
  add('抄写并传阅','不用电，但会占用20秒',{kind:'brief',method:'paper'});
 }
 const milestones=[20,60,80,100,110,160];
 const until=milestones.find(t=>t>a.time)!;
 add(until===160?'等待本轮结束':'等待下一变化','不耗电；如果环境变化，会提前停下',{kind:'wait',until});
 all[all.length-1].duration=Math.min(until,...[w.firstClose,w.secondClose].filter(t=>t>a.time))-a.time;
 return all;
}
