export type Item = 'position'|'people'|'ack';
export type Action = {kind:'send';items:Item[]}|{kind:'wait';until:number}|{kind:'light';duration:10|20}|{kind:'brief';method:'screen'|'paper'};
export interface World { seed:string; preset?:'A'|'B'; firstClose:number; firstHint:'stable'|'fading'; visibility:'clear'|'obstructed'; secondClose:number; version:string }
export interface LogEntry { id:number; action:Action; start:number; end:number; cost:number; energyAfter:number; gained:string[]; note:string; context:string; interrupted:boolean }
export interface Actor { time:number; energy:number; delivered:Record<Item,boolean>; firstContact:boolean; light:0|1|2; lightUsed:boolean; briefed:boolean; paper:boolean; logs:LogEntry[] }
export interface Choice { title:string; detail:string; action:Action; cost:number; duration:number; disabled?:string }
export interface Session { schema:1; id:string; world:World; ghostVersion:number; practice:boolean; player:Actor; ghost:Actor; actions:Action[]; ending:string|null }
export interface Profile { schema:1; ghostVersion:number; completed:string[]; observations:string[] }
