import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { clearScores, getScores, submitScore } from "../src/leaderboard.js";

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

/**
 * Complements getScores read-path clamps: the submit/write path must also
 * normalize sector before persisting so a buggy caller cannot poison the board
 * with sector 0 / 999 and scramble ranking ties.
 */
test("submitScore clamps sector into 1..99 on the write path", () => {
  const low = submitScore({
    score: 40,
    outcome: "dead",
    sector: 0,
    coins: 0,
    stomps: 0,
    durationSec: 12,
    initials: "LO",
  });
  assert.equal(low.rank, 1);
  assert.equal(getScores()[0].sector, 1);

  clearScores();
  const high = submitScore({
    score: 50,
    outcome: "won",
    sector: 200,
    coins: 1,
    stomps: 1,
    durationSec: 90,
    initials: "HI",
  });
  assert.equal(high.rank, 1);
  assert.equal(getScores()[0].sector, 99);

  clearScores();
  const frac = submitScore({
    score: 45,
    outcome: "dead",
    sector: 4.8,
    coins: 0,
    stomps: 0,
    durationSec: 20,
    initials: "FR",
  });
  assert.equal(frac.rank, 1);
  assert.equal(getScores()[0].sector, 4);
});
