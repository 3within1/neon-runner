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

/**
 * Older callers / partial payloads may omit coins, stomps, or durationSec.
 * normalizeEntry must default them to 0 so a submit never writes undefined
 * fields that later poison ranking or the breakdown HUD.
 */
test("submitScore defaults omitted coins, stomps, and duration to 0", () => {
  const result = submitScore(
    /** @type {any} */ ({
      score: 120,
      outcome: "dead",
      sector: 2,
      initials: "OMT",
      // coins / stomps / durationSec intentionally omitted
    })
  );

  assert.equal(result.rank, 1);
  const row = getScores()[0];
  assert.equal(row.score, 120);
  assert.equal(row.coins, 0);
  assert.equal(row.stomps, 0);
  assert.equal(row.durationSec, 0);
  assert.equal(row.sector, 2);
  assert.equal(row.v, 3);
});

test("submitScore floors finite but non-integer coin/stomp counts", () => {
  submitScore({
    score: 80,
    outcome: "won",
    sector: 3,
    coins: 2.9,
    stomps: 1.1,
    durationSec: 12.5,
    initials: "FLR",
  });
  const row = getScores()[0];
  assert.equal(row.coins, 2);
  assert.equal(row.stomps, 1);
  assert.equal(row.durationSec, 12.5);
});
