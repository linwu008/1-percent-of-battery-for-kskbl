import { it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CalculationPanel from '../components/CalculationPanel';
import { createWorld } from '../game/world';
import { createSession } from '../game/replay';
import { survivalOf } from '../game/scoring';

it('结算展开零电量惩罚、部分成果、失败风险和上限截断',()=>{
  const session=createSession(createWorld('calculation-bounds','B'));
  session.player.energy=0;
  session.player.answers=[{questionId:'e1',optionIndex:0,label:'边界验证',cost:1000,idleDrain:0,minutes:35,tier:'critical',qTier:'important',gained:[{outcome:'position',points:100},{outcome:'ack',points:1}],gambled:[{outcome:'relay',points:100,won:false}],note:'',energyAfter:0,survival:0}];
  const html=renderToStaticMarkup(createElement(CalculationPanel,{session}));
  expect(html).toContain('100 × 3 × 1.2 = 360');
  expect(html).toContain('1 × 3 × 1.2 = 3.6');
  expect(html).not.toContain('接力送达 100');
  expect(html).toContain('95.00%');
  expect(html).toContain('− 0.15');
  expect(html).toContain((survivalOf(session.player,session.world.env).p*100).toFixed(2)+'%');
});

it('撑到救援显示实际的最低截断',()=>{
  const session=createSession(createWorld('calculation-lower','B'));
  session.player.energy=0;
  session.player.answers=[{questionId:'e1',optionIndex:-1,label:'等待',cost:0,idleDrain:1000,minutes:100000,tier:'minor',qTier:'minor',gained:[],gambled:[],note:'',energyAfter:0,survival:0}];
  const html=renderToStaticMarkup(createElement(CalculationPanel,{session}));
  expect(html).toContain('0.03～0.95 → 3.00%');
  expect(html).toContain('0 × 1 × 1 = 0');
});
