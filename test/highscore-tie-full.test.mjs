import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { clearScores, isHighScore, submitScore } from "../src/leaderboard.js";

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
  clearScores();
});

const dead = (score, extra = {}) => ({
  score,
  outcome: "dead",
  sector: 2,
  coins: 0,
  stomps: 0,
  durationSec: 40,
  ...extra,
});

/**
 * A full board of equal dead runs: a fresh equal dead (newer `at`) sorts last
 * and must NOT count as a high score. Otherwise the entry UI opens for runs
 * that cannot displace seat 10.
 */
test("isHighScore rejects an equal dead run on a full board of equals", () => {
  for (let i = 0; i < 10; i++) {
    submitScore(dead(250, { initials: `A${i}` }));
  }
  assert.equal(isHighScore(dead(250)), false, "tie with worse timestamp stays out");
  assert.equal(isHighScore(dead(251)), true, "one DATA more still displaces");
});
