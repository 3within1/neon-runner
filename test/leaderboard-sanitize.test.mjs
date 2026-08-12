import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { getScores, migrateScoreStorage } from "../src/leaderboard.js";

// Focus: normalizeEntry / getScores sanitization and legacy-key migration —
// complementary to open PR #21's submitScore / isHighScore persistence suite.

const STORAGE_KEY = "neon-runner-scores-v3";
const LEGACY_KEY = "neon-runner-scores";

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

function seed(rows) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

test("getScores returns [] for missing, non-array, or corrupt JSON", () => {
  assert.deepEqual(getScores(), []);
  localStorage.setItem(STORAGE_KEY, "{not-json");
  assert.deepEqual(getScores(), []);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ score: 10 }));
  assert.deepEqual(getScores(), []);
});

test("getScores drops rows that fail schema validation", () => {
  seed([
    {
      score: 100,
      initials: "AAA",
      outcome: "won",
      at: "2026-01-01T00:00:00.000Z",
      sector: 3,
    },
    { score: -5, initials: "BAD", outcome: "won", at: "2026-01-01T00:00:00.000Z" },
    { score: 50, initials: 12, outcome: "dead", at: "2026-01-01T00:00:00.000Z" },
    { score: 50, initials: "OK", outcome: "draw", at: "2026-01-01T00:00:00.000Z" },
    null,
    "nope",
  ]);
  const scores = getScores();
  assert.equal(scores.length, 1);
  assert.equal(scores[0].score, 100);
  assert.equal(scores[0].initials, "AAA");
});

test("getScores defaults missing sector (won→5, dead→1) and floors score", () => {
  seed([
    {
      score: 120.9,
      initials: "win",
      outcome: "won",
      at: "2026-01-02T00:00:00.000Z",
    },
    {
      score: 80,
      initials: "d0",
      outcome: "dead",
      at: "2026-01-01T00:00:00.000Z",
    },
  ]);
  const scores = getScores();
  assert.equal(scores.length, 2);
  assert.equal(scores[0].score, 120, "score is floored");
  assert.equal(scores[0].sector, 5, "legacy won default sector");
  assert.equal(scores[1].sector, 1, "legacy dead default sector");
  assert.equal(scores[0].initials, "WIN", "initials normalized on read");
});

test("migrateScoreStorage removes pre-v3 legacy keys", () => {
  localStorage.setItem(LEGACY_KEY, JSON.stringify([{ score: 1 }]));
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  migrateScoreStorage();
  assert.equal(localStorage.getItem(LEGACY_KEY), null);
  assert.ok(localStorage.getItem(STORAGE_KEY) !== null, "v3 key retained");
});
