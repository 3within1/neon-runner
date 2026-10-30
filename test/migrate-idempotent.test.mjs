import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { getScores, migrateScoreStorage } from "../src/leaderboard.js";

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

/**
 * Boot calls migrateScoreStorage every load. A second call (hot reload /
 * double init) must keep wiping legacy keys without touching the v3 board.
 */
test("migrateScoreStorage is safe to call twice and preserves the v3 board", () => {
  const row = {
    score: 220,
    initials: "NEO",
    outcome: "won",
    at: "2026-01-01T00:00:00.000Z",
    sector: 5,
    coins: 4,
    stomps: 6,
    durationSec: 180,
  };
  globalThis.localStorage.setItem(LEGACY_KEY, JSON.stringify([{ score: 1 }]));
  globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify([row]));

  migrateScoreStorage();
  migrateScoreStorage();

  assert.equal(globalThis.localStorage.getItem(LEGACY_KEY), null);
  const scores = getScores();
  assert.equal(scores.length, 1);
  assert.equal(scores[0].score, 220);
  assert.equal(scores[0].initials, "NEO");
});

test("migrateScoreStorage is a no-op when no legacy key exists", () => {
  globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  assert.doesNotThrow(() => {
    migrateScoreStorage();
    migrateScoreStorage();
  });
  assert.equal(globalThis.localStorage.getItem(LEGACY_KEY), null);
  assert.deepEqual(getScores(), []);
});
