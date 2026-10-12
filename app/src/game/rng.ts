/**
 * 一个种子，一条随机流。所有随机都从这里出，保证：
 * 相同编号必然复现同一个世界；玩家与 Ghost 面对的赌运也完全一致。
 */
export function hash(text: string): number {
  let h = 2166136261;
  for (const char of text) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
  return h >>> 0;
}

export function makeRng(seed: string, stream = "") {
  let state = hash(seed + "|" + stream) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
}

export function pick<T>(seed: string, stream: string, list: readonly T[]): T {
  return list[Math.floor(makeRng(seed, stream)() * list.length) % list.length];
}

export function shuffle<T>(seed: string, stream: string, list: readonly T[]): T[] {
  const rng = makeRng(seed, stream);
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** 赌运：同一局里玩家与 Ghost 抽到的是同一个数，运气不构成对照差异。 */
export function gambleRoll(seed: string, questionId: string, index: number): number {
  return makeRng(seed, `gamble:${questionId}:${index}`)();
}
