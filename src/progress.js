/**
 * Persistent meta: sector unlocks, best clear time, hard-mode preference.
 */

const UNLOCK_KEY = "neon-runner-unlock-v1";
const BEST_CLEAR_KEY = "neon-runner-best-clear-v1";
const HARD_KEY = "neon-runner-hard-v1";

/** Highest sector index the player may start from (0-based). */
export function getUnlockedSector() {
  try {
    const n = Number(localStorage.getItem(UNLOCK_KEY));
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(99, Math.floor(n)));
  } catch {
    return 0;
  }
}

/** @param {number} index */
export function unlockSector(index) {
  const next = Math.max(getUnlockedSector(), Math.floor(index));
  try {
    localStorage.setItem(UNLOCK_KEY, String(next));
  } catch {
    /* ignore */
  }
  return next;
}

/** @returns {number | null} best full-clear time in seconds */
export function getBestClearTime() {
  try {
    const n = Number(localStorage.getItem(BEST_CLEAR_KEY));
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  } catch {
    return null;
  }
}

/** @param {number} durationSec */
export function recordClearTime(durationSec) {
  const t = Number(durationSec);
  if (!Number.isFinite(t) || t <= 0) return getBestClearTime();
  const prev = getBestClearTime();
  if (prev === null || t < prev) {
    try {
      localStorage.setItem(BEST_CLEAR_KEY, String(t));
    } catch {
      /* ignore */
    }
    return t;
  }
  return prev;
}

export function isHardModePreferred() {
  try {
    return localStorage.getItem(HARD_KEY) === "1";
  } catch {
    return false;
  }
}

/** @param {boolean} on */
export function setHardModePreferred(on) {
  try {
    localStorage.setItem(HARD_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/** @param {number} sec */
export function formatClock(sec) {
  const s = Math.max(0, Number(sec) || 0);
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}
