import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { getScores, submitScore } from "../src/leaderboard.js";

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
}

beforeEach(() => {
  globalThis.localStorage = new MemStorage();
});

test("submitScore floors fractional DATA and accepts won outcomes", () => {
  const result = submitScore({
    score: 99.9,
    outcome: "won",
    sector: 4,
    coins: 1,
    stomps: 2,
    durationSec: 42,
    initials: "neo",
  });
  assert.equal(result.rank, 1);
  assert.equal(result.isNewBest, true);
  assert.equal(getScores()[0].score, 99);
  assert.equal(getScores()[0].outcome, "won");
  assert.equal(getScores()[0].initials, "NEO");
});
