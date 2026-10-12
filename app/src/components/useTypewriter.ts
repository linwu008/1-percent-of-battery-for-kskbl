import { useEffect, useState } from "react";

/**
 * 逐字显示正文。打字只影响显示，不推进剧情、不消耗电量。
 * 尊重系统的「减少动效」设置，并允许随时点击跳过。
 */
export function useTypewriter(text: string, speed = 26, instant = false) {
  const [frame, setFrame] = useState({ text, count: 0 });
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
  const count = frame.text === text ? frame.count : 0;
  const complete = instant || reduced || count >= text.length;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setFrame((previous) => ({
      text,
      count: instant || reduced ? text.length : previous.text === text ? previous.count : 0,
    }));
  }, [text, instant, reduced]);

  useEffect(() => {
    if (complete) return;
    const pause = /[，。！？；…]/.test(text[count - 1] ?? "") ? 150 : speed;
    const id = window.setTimeout(() => setFrame({ text, count: count + 1 }), pause);
    return () => window.clearTimeout(id);
  }, [text, count, speed, complete]);

  const skip = () => setFrame({ text, count: text.length });
  return { shown: complete ? text : text.slice(0, count), done: complete, skip };
}

/**
 * 按顺序逐段打完：前一段打完才开始下一段。
 * skip() 一次性把剩下的全部显示出来（后面的段落不再逐字）。
 */
export function useTypewriterAll(lines: string[], speed = 26, instant = false) {
  const current = useTypewriter(lines.join("\n\n"), speed, instant);
  let offset = 0;
  let stage = 0;
  while (stage < lines.length - 1 && current.shown.length >= offset + lines[stage].length + 2) {
    offset += lines[stage].length + 2;
    stage++;
  }
  return { stage, shown: current.shown.slice(offset), done: current.done, skip: current.skip };
}
