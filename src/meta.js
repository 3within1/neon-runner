/**
 * Persistent meta: unlocks, skins, settings, keybinds, sector best times.
 */

const META_KEY = "neon-runner-meta-v2";

/** @typedef {'default' | 'signal' | 'ember' | 'lockdown'} SkinId */

/**
 * @typedef {{
 *   hasCleared: boolean,
 *   lockdownCleared: boolean,
 *   unlockedSkins: SkinId[],
 *   skin: SkinId,
 *   bestTimes: number[],
 *   colorblind: boolean,
 *   forceReduceMotion: boolean | null,
 *   bindings: {
 *     left: string,
 *     right: string,
 *     jump: string,
 *     dash: string,
 *     pause: string,
 *     mute: string,
 *   },
 * }} MetaState
 */

export const DEFAULT_BINDINGS = {
  left: "ArrowLeft",
  right: "ArrowRight",
  jump: "Space",
  dash: "ShiftLeft",
  pause: "Escape",
  mute: "KeyM",
};

/** @type {MetaState} */
const defaults = {
  hasCleared: false,
  lockdownCleared: false,
  unlockedSkins: ["default"],
  skin: "default",
  bestTimes: [],
  colorblind: false,
  forceReduceMotion: null,
  bindings: { ...DEFAULT_BINDINGS },
};

/** @type {MetaState} */
let meta = load();

function load() {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return structuredClone(defaults);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(defaults),
      ...parsed,
      unlockedSkins: Array.isArray(parsed.unlockedSkins)
        ? ["default", ...parsed.unlockedSkins.filter((s) => s !== "default")]
        : ["default"],
      bindings: { ...DEFAULT_BINDINGS, ...(parsed.bindings || {}) },
      bestTimes: Array.isArray(parsed.bestTimes) ? parsed.bestTimes.map(Number) : [],
    };
  } catch {
    return structuredClone(defaults);
  }
}

function persist() {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    /* ignore */
  }
}

export function getMeta() {
  return meta;
}

export function saveMeta(patch) {
  meta = { ...meta, ...patch };
  persist();
  return meta;
}

export function unlockSkin(id) {
  if (!meta.unlockedSkins.includes(id)) {
    meta.unlockedSkins = [...meta.unlockedSkins, id];
    persist();
  }
}

export function setSkin(id) {
  if (!meta.unlockedSkins.includes(id)) return meta.skin;
  meta.skin = id;
  persist();
  return meta.skin;
}

export function markCleared(lockdown = false) {
  meta.hasCleared = true;
  if (lockdown) meta.lockdownCleared = true;
  unlockSkin("ember");
  if (lockdown) unlockSkin("lockdown");
  persist();
}

/** Award signal skin at 500+ DATA lifetime best via run score. */
export function considerScoreUnlocks(score) {
  if (score >= 500) unlockSkin("signal");
}

/**
 * @param {number} sectorIndex
 * @param {number} seconds
 * @returns {{ best: number, improved: boolean }}
 */
export function recordSectorTime(sectorIndex, seconds) {
  if (!(seconds > 0) || sectorIndex < 0) return { best: Infinity, improved: false };
  const times = meta.bestTimes.slice();
  while (times.length <= sectorIndex) times.push(0);
  const prev = times[sectorIndex] || 0;
  const improved = prev <= 0 || seconds < prev;
  if (improved) {
    times[sectorIndex] = seconds;
    meta.bestTimes = times;
    persist();
  }
  return { best: improved ? seconds : prev, improved };
}

export function getSectorBestTime(sectorIndex) {
  return meta.bestTimes[sectorIndex] || 0;
}

export function formatClock(sec) {
  const s = Math.max(0, sec);
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 100);
  return `${mins}:${String(secs).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
}

export const RUNNER_SKINS = {
  default: {
    id: "default",
    name: "GRID",
    body: "#10182a",
    accent: "#35f0ff",
    trim: "#ff2bd6",
    core: "#b6ff3b",
  },
  signal: {
    id: "signal",
    name: "SIGNAL",
    body: "#0a2010",
    accent: "#b6ff3b",
    trim: "#35f0ff",
    core: "#ffb347",
  },
  ember: {
    id: "ember",
    name: "EMBER",
    body: "#201008",
    accent: "#ffb347",
    trim: "#ff2bd6",
    core: "#35f0ff",
  },
  lockdown: {
    id: "lockdown",
    name: "LOCKDOWN",
    body: "#1a0610",
    accent: "#ff2bd6",
    trim: "#ffb347",
    core: "#ff6060",
  },
};

export function getActiveSkin() {
  return RUNNER_SKINS[meta.skin] || RUNNER_SKINS.default;
}
