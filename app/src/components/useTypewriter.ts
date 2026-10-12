import { useEffect, useState } from "react";

/**
 * 逐字显示正文。打字只影响显示，不推进剧情、不消耗电量。
 * 尊重系统的「减少动效」设置，并允许随时点击跳过。
 */
export function useTypewriter(text: string, speed = 26, instant = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    if (instant) {
      setCount(text.length);
      return;
    }
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setCount(text.length);
      return;
    }
    const id = window.setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          window.clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, speed);
    return () => window.clearInterval(id);
  }, [text, speed, instant]);

  const skip = () => setCount(text.length);
  return { shown: text.slice(0, count), done: count >= text.length, skip };
}

/**
 * 按顺序逐段打完：前一段打完才开始下一段。
 * skip() 一次性把剩下的全部显示出来（后面的段落不再逐字）。
 */
export function useTypewriterAll(lines: string[], speed = 26) {
  const [stage, setStage] = useState(0);
  const [rushed, setRushed] = useState(false);
  const current = useTypewriter(lines[stage] ?? "", speed, rushed);

  useEffect(() => setStage(0), [lines]);

  useEffect(() => {
    if (stage >= lines.length - 1) return;
    if (!current.done) return;
    const id = window.setTimeout(() => setStage((n) => n + 1), 240);
    return () => window.clearTimeout(id);
  }, [current.done, lines.length, stage]);

  const skip = () => {
    setRushed(true);
    setStage(lines.length - 1);
  };
  const done = stage >= lines.length - 1 && current.done;
  return { stage, shown: current.shown, done, skip };
}
