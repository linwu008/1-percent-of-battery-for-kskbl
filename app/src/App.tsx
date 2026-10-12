import { useEffect, useRef, useState } from "react";
import type { Action, Session } from "./game/types";
import { createWorld } from "./game/world";
import { createSession, step } from "./game/replay";
import {
  loadSession,
  storeSession,
  loadProfile,
  storeProfile,
} from "./game/storage";
import { acceptGrowth, emptyProfile, observe } from "./game/ghost";
import StartScreen from "./components/StartScreen";
import EventScreen from "./components/EventScreen";
import EndingScreen from "./components/EndingScreen";
import ResultsScreen from "./components/ResultsScreen";

export default function App() {
  const [loaded] = useState(loadSession);
  const [session, setSession] = useState<Session | null>(loaded.session);
  const [profile, setProfile] = useState(loadProfile);
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
      setError("成长记录暂时无法保存，本次会话仍可继续。");
  }, [profile]);
  const begin = (preset?: "A" | "B", same = false) => {
    const world =
      same && session
        ? session.world
        : createWorld(crypto.randomUUID().slice(0, 8), preset);
    setSession(
      createSession(
        world,
        same && session ? session.ghostVersion : profile.ghostVersion,
        same,
      ),
    );
    setHome(false);
    setError(null);
  };
  const choose = (action: Action) => {
    if (!session || lock.current) return;
    lock.current = true;
    try {
      setSession(step(session, action));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
    queueMicrotask(() => {
      lock.current = false;
    });
  };
  const finish = (ending: "relay" | "check") => {
    if (
      !session ||
      session.player.time !== 160 ||
      (ending === "relay" && !session.player.briefed)
    )
      return;
    const done = { ...session, ending };
    setSession(done);
    setProfile((p) => observe(p, done));
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
          资源决策模拟器 <span className="version">v0.1</span>
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
      {home ? (
        <StartScreen
          profile={profile}
          hasSession={!!session}
          onBegin={begin}
          onContinue={() => setHome(false)}
          onReset={() => setProfile(emptyProfile())}
        />
      ) : session?.ending ? (
        <ResultsScreen
          session={session}
          profile={profile}
          onNew={() => begin()}
          onReplay={() => begin(undefined, true)}
          onGrow={() => setProfile((p) => acceptGrowth(p))}
        />
      ) : session?.player.time === 160 ? (
        <EndingScreen session={session} onFinish={finish} />
      ) : session ? (
        <EventScreen session={session} onChoose={choose} />
      ) : null}
      <footer className="site-footer">
        <span>一份电量，两种人生。</span>
        <span>
          模拟参数 · 非真实设备电量 / 救援工具{" "}
          <span className="footer-rule">RULES 0.1.0</span>
        </span>
      </footer>
    </div>
  );
}
