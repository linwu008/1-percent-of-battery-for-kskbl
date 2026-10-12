import { useEffect, useRef, useState } from "react";
import { RULE_VERSION } from "./game/config";
import { createWorld } from "./game/world";
import { createSession, finish, isDone, pickTalent, step } from "./game/replay";
import { emptyProfile } from "./game/ghost";
import { summarize } from "./game/scoring";
import {
  loadSession,
  storeSession,
  loadProfile,
  storeProfile,
} from "./game/storage";
import type { Profile, Session } from "./game/types";
import StartScreen from "./components/StartScreen";
import TalentScreen from "./components/TalentScreen";
import EventScreen from "./components/EventScreen";
import ResultsScreen from "./components/ResultsScreen";

export default function App() {
  const [loaded] = useState(loadSession);
  const [session, setSession] = useState<Session | null>(loaded.session);
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [home, setHome] = useState(!loaded.session);
  const [error, setError] = useState<string | null>(loaded.error);
  const lock = useRef(false);

  const exportRecovery = () => {
    if (!loaded.recovery) return;
    const url = URL.createObjectURL(
      new Blob([loaded.recovery], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "1pct-recovered-record.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  useEffect(() => {
    if (session && !storeSession(session))
      setError("本地存储不可用，本局仍可继续；结束后请导出记录。");
  }, [session]);

  useEffect(() => {
    if (!storeProfile(profile))
      setError("进度暂时无法保存，本次会话仍可继续。");
  }, [profile]);

  /** 一局结束时记录种子与最高分。 */
  const record = (s: Session) => {
    const score = summarize(s.player).score;
    setProfile((p) => ({
      schema: 2,
      completed: p.completed.includes(s.world.seed)
        ? p.completed
        : [...p.completed, s.world.seed],
      best: Math.max(p.best, score),
    }));
  };

  const begin = (preset?: "A" | "B") => {
    // 固定案例连种子一起固定，演示和比较才对得上；随机局才用新种子。
    const seed = preset ? `case-${preset}` : crypto.randomUUID().slice(0, 8);
    const world = createWorld(seed, preset);
    setSession(createSession(world));
    setHome(false);
    setError(null);
  };

  const replay = () => {
    if (!session) return;
    const world = createWorld(session.world.seed, session.world.preset);
    setSession(createSession(world));
    setError(null);
  };

  const choose = (index: number) => {
    if (!session || lock.current) return;
    lock.current = true;
    try {
      const next = step(session, index);
      setSession(next);
      setError(null);
      if (isDone(next)) record(next);
    } catch (e) {
      setError((e as Error).message);
    }
    queueMicrotask(() => {
      lock.current = false;
    });
  };

  const drain = () => {
    if (!session || lock.current) return;
    lock.current = true;
    try {
      const next = finish(session);
      setSession(next);
      record(next);
    } catch (e) {
      setError((e as Error).message);
    }
    queueMicrotask(() => {
      lock.current = false;
    });
  };

  const pick = (talentId: string) => {
    if (!session) return;
    try {
      setSession(pickTalent(session, talentId));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <button
          className="wordmark"
          onClick={() => setHome(true)}
          aria-label="回到开始页"
        >
          <span className="logo-cell">▰</span> ONE
          <span className="mint">%</span>
          <span className="wordmark-sub">最后的余量</span>
        </button>
        <div className="header-meta">
          <span className="live-dot" />
          资源决策模拟器 <span className="version">v{RULE_VERSION}</span>
        </div>
      </header>
      {loaded.recovery && (
        <div className="alert">
          <span>有一份旧记录已保留，可先导出备份。</span>
          <button onClick={exportRecovery}>导出旧记录</button>
        </div>
      )}
      {error && (
        <div role="alert" className="alert">
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="关闭提示">
            ×
          </button>
        </div>
      )}
      {home || !session ? (
        <StartScreen
          profile={profile}
          hasSession={!!session}
          onBegin={begin}
          onContinue={() => setHome(false)}
        />
      ) : !session.player.talent ? (
        <TalentScreen session={session} onPick={pick} />
      ) : isDone(session) ? (
        <ResultsScreen
          session={session}
          profile={profile}
          onNew={() => begin()}
          onReplay={replay}
        />
      ) : (
        <EventScreen session={session} onChoose={choose} onDrain={drain} />
      )}
      <footer className="site-footer">
        <span>一份电量，两种人生。</span>
        <span>
          模拟参数 · 非真实设备电量 / 救援工具{" "}
          <span className="footer-rule">RULES {RULE_VERSION}</span>
        </span>
      </footer>
    </div>
  );
}
