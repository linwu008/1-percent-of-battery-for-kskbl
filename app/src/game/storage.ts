import { emptyProfile } from "./ghost";
import { verifyExport } from "./replay";
import type { Session, Profile } from "./types";
const SESSION = "one-percent-session-v1",
  PROFILE = "one-percent-profile-v1",
  RECOVERY = "one-percent-session-recovery-v1";
let pendingRecovery: string | null = null;
export function loadSession(): {
  session: Session | null;
  error: string | null;
  recovery: string | null;
} {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(SESSION);
    const session = raw ? verifyExport(JSON.parse(raw)) : null;
    pendingRecovery = null;
    return { session, error: null, recovery: localStorage.getItem(RECOVERY) };
  } catch {
    pendingRecovery = raw;
    return {
      session: null,
      error: "本地记录不可用或版本不兼容，可以新开一局。",
      recovery: raw,
    };
  }
}
export function storeSession(s: Session): boolean {
  try {
    if (pendingRecovery !== null) {
      const previous = localStorage.getItem(RECOVERY);
      if (previous !== null && previous !== pendingRecovery)
        localStorage.setItem(
          `${RECOVERY}-archive-${crypto.randomUUID()}`,
          previous,
        );
      localStorage.setItem(RECOVERY, pendingRecovery);
    }
    localStorage.setItem(SESSION, JSON.stringify(s));
    pendingRecovery = null;
    return true;
  } catch {
    return false;
  }
}
export function loadProfile(): Profile {
  try {
    const p = JSON.parse(
      localStorage.getItem(PROFILE) || "null",
    ) as Profile | null;
    if (
      !p ||
      p.schema !== 2 ||
      !Array.isArray(p.completed) ||
      typeof p.best !== "number" ||
      !Number.isFinite(p.best) ||
      p.completed.length > 10000 ||
      !p.completed.every((x) => typeof x === "string") ||
      new Set(p.completed).size !== p.completed.length
    )
      return emptyProfile();
    return p;
  } catch {
    return emptyProfile();
  }
}
export function storeProfile(p: Profile): boolean {
  try {
    localStorage.setItem(PROFILE, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}
