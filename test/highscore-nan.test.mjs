import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { isHighScore } from "../src/leaderboard.js";

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
 * Entry UI must stay closed for non-positive / non-numeric DATA. NaN floors to
 * 0 via `Number(run?.score) || 0`, so a poisoned score never ranks.
 */
test("isHighScore rejects NaN, undefined, and non-positive scores", () => {
  const base = { outcome: "dead", sector: 1, coins: 0, stomps: 0, durationSec: 10 };
  assert.equal(isHighScore({ ...base, score: Number.NaN }), false);
  assert.equal(isHighScore({ ...base, score: undefined }), false);
  assert.equal(isHighScore({ ...base, score: -10 }), false);
  assert.equal(isHighScore({ ...base, score: 0 }), false);
  assert.equal(isHighScore({ ...base, score: 1 }), true, "any positive score qualifies on an empty board");
});
