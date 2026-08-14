import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  compareEntries,
  normalizeInitials,
  formatRunBreakdown,
  getScores,
  isHighScore,
  submitScore,
  clearScores,
} from "../src/leaderboard.js";

// leaderboard.js reads/writes localStorage lazily (inside try/catch), so an
// in-memory shim lets us exercise the real submit/rank/cap accumulation logic.
class MemStorage {
  #m = new Map();
  getItem(k) {
    return this.#m.has(k) ? this.#m.get(k) : null;
  }
  setItem(k, v) {
    this.#m.set(k, String(v));
  }
  removeItem(k) {
    this.#m.delete(k);
  }
  clear() {
    this.#m.clear();
  }
}

beforeEach(() => {
  globalThis.localStorage = new MemStorage();
});

const run = (score, extra = {}) => ({
  score,
  outcome: "dead",
  sector: 1,
  coins: 0,
  stomps: 0,
  durationSec: 10,
  ...extra,
});

test("normalizeInitials cleans, pads, and falls back", () => {
  assert.equal(normalizeInitials("ab"), "ABX");
  assert.equal(normalizeInitials("hello"), "HEL");
  assert.equal(normalizeInitials("a-1"), "A1X");
  assert.equal(normalizeInitials(""), "RUN");
  assert.equal(normalizeInitials("!!!"), "RUN");
});

test("compareEntries ranks by score, then won>dead, then sector, then time", () => {
  const base = { score: 100, outcome: "dead", sector: 1, durationSec: 10, at: "2020" };
  assert.ok(compareEntries({ ...base, score: 200 }, base) < 0, "higher score ranks first");
  assert.ok(
    compareEntries({ ...base, outcome: "won" }, { ...base, outcome: "dead" }) < 0,
    "won beats dead at equal score"
  );
  assert.ok(
    compareEntries({ ...base, sector: 5 }, { ...base, sector: 2 }) < 0,
    "deeper sector wins tie"
  );
  assert.ok(
    compareEntries({ ...base, durationSec: 5 }, { ...base, durationSec: 20 }) < 0,
    "faster run wins tie"
  );
});

test("submitScore inserts, ranks, and reports new best", () => {
  const a = submitScore(run(100));
  assert.deepEqual({ rank: a.rank, isNewBest: a.isNewBest }, { rank: 1, isNewBest: true });

  const b = submitScore(run(300));
  assert.equal(b.rank, 1, "higher score takes rank 1");
  assert.equal(b.isNewBest, true);

  const c = submitScore(run(50));
  assert.equal(c.rank, 3, "lowest of three lands at rank 3");
  assert.equal(c.isNewBest, false);

  assert.deepEqual(
    getScores().map((s) => s.score),
    [300, 100, 50],
    "board is sorted high to low"
  );
});

test("submitScore rejects non-positive / invalid scores", () => {
  assert.deepEqual(submitScore(run(0)).rank, null);
  assert.equal(getScores().length, 0);
});

test("board is capped at 10 and keeps the highest", () => {
  for (let i = 1; i <= 12; i++) submitScore(run(i * 10));
  const scores = getScores();
  assert.equal(scores.length, 10, "never exceeds 10 entries");
  assert.equal(scores[0].score, 120, "highest retained");
  assert.equal(scores[9].score, 30, "lowest two (10, 20) dropped");
});

test("isHighScore respects the top-10 cutoff", () => {
  assert.equal(isHighScore(run(500)), true, "any positive score qualifies on an empty board");
  assert.equal(isHighScore(run(0)), false, "zero never qualifies");

  for (let i = 0; i < 10; i++) submitScore(run(100));
  assert.equal(isHighScore(run(150)), true, "a higher score displaces the last seat");
  assert.equal(isHighScore(run(50)), false, "a lower score does not make a full board");
  assert.equal(
    isHighScore(run(100, { outcome: "won" })),
    true,
    "a win ties on score but outranks the dead entries"
  );
});

test("clearScores empties the board", () => {
  submitScore(run(100));
  assert.equal(getScores().length, 1);
  clearScores();
  assert.equal(getScores().length, 0);
});

test("formatRunBreakdown renders the expected summary", () => {
  const line = formatRunBreakdown({
    score: 240,
    coins: 3,
    stomps: 2,
    sectorIndex: 6,
    sectorTotal: 7,
    durationSec: 75,
    deaths: 1,
    maxCombo: 4,
    mode: "lockdown",
  });
  assert.match(line, /DATA 0240/);
  assert.match(line, /PACKS 3 \(\+30\)/); // 3 packs * SCORE_PACK(10)
  assert.match(line, /KILLS 2 \(\+210\)/); // 240 - 30
  assert.match(line, /SECTOR 07\/07/);
  assert.match(line, /TIME 1:15/);
  assert.match(line, /DEATHS 1 · COMBO 4 · LOCKDOWN/);
});

test("compareEntries treats non-positive duration as worse than a timed run", () => {
  const timed = { score: 300, outcome: "won", sector: 4, durationSec: 90, at: "2026-01-01T00:00:00.000Z" };
  const zero = { ...timed, durationSec: 0 };
  const negative = { ...timed, durationSec: -5 };
  assert.ok(compareEntries(timed, zero) < 0);
  assert.ok(compareEntries(timed, negative) < 0);
});

test("compareEntries breaks remaining ties with earlier timestamp", () => {
  const earlier = { score: 100, outcome: "won", sector: 3, durationSec: 60, at: "2026-01-01T00:00:00.000Z" };
  const later = { ...earlier, at: "2026-06-01T00:00:00.000Z" };
  assert.ok(compareEntries(earlier, later) < 0, "earlier ISO timestamp ranks first");
  assert.ok(compareEntries(later, earlier) > 0);
});

test("formatRunBreakdown labels normal and time-trial modes", () => {
  const base = {
    score: 250,
    coins: 10,
    stomps: 5,
    sectorIndex: 0,
    sectorTotal: 7,
    durationSec: 125,
    deaths: 1,
    maxCombo: 3,
  };
  assert.match(formatRunBreakdown({ ...base, mode: "normal" }), /RUN$/);
  assert.match(formatRunBreakdown({ ...base, mode: "timeAttack" }), /TRIAL$/);
});
