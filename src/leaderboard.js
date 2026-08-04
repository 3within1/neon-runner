import { SCORE_PACK } from "./constants.js";

const STORAGE_KEY = "neon-runner-scores-v3";
const LEGACY_STORAGE_KEYS = ["neon-runner-scores"];
const INITIALS_KEY = "neon-runner-initials";
const MAX_ENTRIES = 10;
const DEFAULT_INITIALS = "RUN";
const SCHEMA_VERSION = 3;

/**
 * @typedef {{
 *   v: number,
 *   score: number,
 *   initials: string,
 *   outcome: 'won' | 'dead',
 *   at: string,
 *   sector: number,
 *   coins: number,
 *   stomps: number,
 *   durationSec: number,
 * }} ScoreEntry
 */

/**
 * @param {unknown} e
 * @returns {ScoreEntry | null}
 */
function normalizeEntry(e) {
  if (!e || typeof e !== "object") return null;
  const row = /** @type {Record<string, unknown>} */ (e);
  if (typeof row.score !== "number" || !Number.isFinite(row.score) || row.score < 0) return null;
  if (typeof row.initials !== "string") return null;
  if (row.outcome !== "won" && row.outcome !== "dead") return null;
  if (typeof row.at !== "string") return null;

  const sector =
    typeof row.sector === "number" && Number.isFinite(row.sector)
      ? Math.max(1, Math.min(99, Math.floor(row.sector)))
      : row.outcome === "won"
        ? 5
        : 1;
  const coins =
    typeof row.coins === "number" && Number.isFinite(row.coins) ? Math.max(0, Math.floor(row.coins)) : 0;
  const stomps =
    typeof row.stomps === "number" && Number.isFinite(row.stomps) ? Math.max(0, Math.floor(row.stomps)) : 0;
  const durationSec =
    typeof row.durationSec === "number" && Number.isFinite(row.durationSec)
      ? Math.max(0, row.durationSec)
      : 0;

  return {
    v: SCHEMA_VERSION,
    score: Math.floor(row.score),
    initials: normalizeInitials(row.initials),
    outcome: row.outcome,
    at: row.at,
    sector,
    coins,
    stomps,
    durationSec,
  };
}

/**
 * Higher is better. Used for ranking and isHighScore.
 * @param {ScoreEntry} a
 * @param {ScoreEntry} b
 */
export function compareEntries(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  // Full clears beat crashes at the same DATA total.
  if (a.outcome !== b.outcome) return a.outcome === "won" ? -1 : 1;
  if (b.sector !== a.sector) return b.sector - a.sector;
  // Faster run wins ties (display only — not a score bonus).
  if (a.durationSec !== b.durationSec) {
    if (a.durationSec <= 0) return 1;
    if (b.durationSec <= 0) return -1;
    return a.durationSec - b.durationSec;
  }
  return a.at.localeCompare(b.at);
}

/**
 * @returns {ScoreEntry[]}
 */
export function getScores() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeEntry)
      .filter(Boolean)
      .sort(compareEntries)
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

/**
 * Drop pre-v3 boards so 1-point-era totals never mix with weighted DATA.
 * Safe to call on every boot.
 */
export function migrateScoreStorage() {
  try {
    for (const key of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}

function persist(scores) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * @param {string} value
 */
export function normalizeInitials(value) {
  const cleaned = String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 3);
  if (!cleaned) return DEFAULT_INITIALS;
  return cleaned.padEnd(3, "X");
}

export function getLastInitials() {
  try {
    const saved = localStorage.getItem(INITIALS_KEY);
    if (saved) return normalizeInitials(saved);
  } catch {
    /* ignore */
  }
  return DEFAULT_INITIALS;
}

/**
 * @param {string} initials
 */
export function setLastInitials(initials) {
  const next = normalizeInitials(initials);
  try {
    localStorage.setItem(INITIALS_KEY, next);
  } catch {
    /* ignore */
  }
  return next;
}

/**
 * @param {Omit<ScoreEntry, 'v' | 'initials' | 'at'> & { initials?: string, at?: string }} candidate
 */
function asCandidate(candidate) {
  return normalizeEntry({
    v: SCHEMA_VERSION,
    score: candidate.score,
    initials: candidate.initials ?? DEFAULT_INITIALS,
    outcome: candidate.outcome,
    at: candidate.at ?? new Date().toISOString(),
    sector: candidate.sector,
    coins: candidate.coins,
    stomps: candidate.stomps,
    durationSec: candidate.durationSec,
  });
}

/**
 * True if this run would place in the top 10 (including ties that displace the last seat).
 * @param {Omit<ScoreEntry, 'v' | 'initials' | 'at'> & { initials?: string }} run
 */
export function isHighScore(run) {
  const n = Math.floor(Number(run?.score) || 0);
  if (n <= 0) return false;
  const scores = getScores();
  if (scores.length < MAX_ENTRIES) return true;
  const candidate = asCandidate({
    ...run,
    score: n,
    at: new Date().toISOString(),
  });
  if (!candidate) return false;
  const trial = scores.concat(candidate).sort(compareEntries);
  return trial.indexOf(candidate) < MAX_ENTRIES;
}

/**
 * @param {{
 *   score: number,
 *   initials?: string,
 *   outcome: 'won' | 'dead',
 *   sector: number,
 *   coins: number,
 *   stomps: number,
 *   durationSec: number,
 * }} entry
 * @returns {{ rank: number | null, isNewBest: boolean, scores: ScoreEntry[] }}
 */
export function submitScore(entry) {
  const n = Math.floor(Number(entry.score) || 0);
  if (n <= 0 || (entry.outcome !== "won" && entry.outcome !== "dead")) {
    return { rank: null, isNewBest: false, scores: getScores() };
  }

  const name = setLastInitials(entry.initials ?? getLastInitials());
  const next = asCandidate({
    score: n,
    initials: name,
    outcome: entry.outcome,
    sector: entry.sector,
    coins: entry.coins,
    stomps: entry.stomps,
    durationSec: entry.durationSec,
    at: new Date().toISOString(),
  });
  if (!next) return { rank: null, isNewBest: false, scores: getScores() };

  const scores = getScores();
  scores.push(next);
  scores.sort(compareEntries);
  const rank = scores.indexOf(next) + 1;
  if (rank === 0 || rank > MAX_ENTRIES) {
    return { rank: null, isNewBest: false, scores: getScores() };
  }

  const trimmed = scores.slice(0, MAX_ENTRIES);
  persist(trimmed);
  return { rank, isNewBest: rank === 1, scores: trimmed };
}

export function clearScores() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return [];
}

/**
 * @param {{ score: number, coins: number, stomps: number, sectorIndex: number, sectorTotal: number, durationSec: number, outcome?: 'won' | 'dead' }} stats
 */
export function formatRunBreakdown(stats) {
  const sectorLabel = `${String(stats.sectorIndex + 1).padStart(2, "0")}/${String(stats.sectorTotal).padStart(2, "0")}`;
  const mins = Math.floor(stats.durationSec / 60);
  const secs = Math.floor(stats.durationSec % 60);
  const clock = `${mins}:${String(secs).padStart(2, "0")}`;
  const packPts = stats.coins * SCORE_PACK;
  const killPts = Math.max(0, stats.score - packPts);
  return `DATA ${String(stats.score).padStart(4, "0")} · PACKS ${stats.coins} (+${packPts}) · KILLS ${stats.stomps} (+${killPts}) · SECTOR ${sectorLabel} · TIME ${clock}`;
}
