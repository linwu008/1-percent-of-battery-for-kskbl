import { describe, expect, it } from 'vitest';
import { QUESTION_BY_ID } from './content/questions';
import { TALENTS } from './content/talents';
import { answer, initialActor, preview } from './engine';
import { createWorld } from './world';

describe('第四选项的环境硬限制', () => {
  it('网络没有接通时，回联策略不能把失败的发送变成成果', () => {
    const w = createWorld('review-139');
    w.env.network = 'dead';
    const q = QUESTION_BY_ID.e22;
    const before = initialActor('listener');
    const p = preview(w, before, q, 3);
    expect(p.gain).toBeNull();
    expect(p.gamble).toBeNull();
    const after = answer(w, before, q.id, 3);
    expect(after.answers[0].gained).toEqual([]);
    expect(after.answers[0].gambled).toEqual([]);
    expect(after.answers[0].note).toContain('没传出去');
    expect(after.energy).toBeLessThan(before.energy);
  });

  it.each(['m19', 'l12'])('完全断网时%s拍照发送没有送达成果，恢复网络后可生效', (id) => {
    const w = createWorld('photo-network');
    w.env.daylight = 'day';
    const q = QUESTION_BY_ID[id];
    for(const talent of TALENTS) {
      const a = initialActor(talent.id);
      w.env.network = 'dead';
      expect(preview(w,a,q,3).gain, talent.id).toBeNull();
      w.env.network = 'local';
      expect(preview(w,a,q,3).gain?.points, talent.id).toBeGreaterThan(0);
    }
  });

  it('不可能传达的赌运不会被策略加成恢复', () => {
    const w = createWorld('no-network-gamble');
    w.env.network = 'dead';
    expect(preview(w,initialActor('listener'),QUESTION_BY_ID.e17,3).gamble).toBeNull();
  });
});
