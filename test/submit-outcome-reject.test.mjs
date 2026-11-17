import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { getScores, submitScore } from "../src/leaderboard.js";

// submitScore only accepts won|dead. A bad outcome must not poison the board
// (UI bugs or future callers sending "draw" / undefined).

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

const base = {
  score: 250,
  sector: 2,
  coins: 1,
  stomps: 1,
  durationSec: 40,
};

test("submitScore rejects outcomes other than won or dead", () => {
  assert.equal(submitScore({ ...base, outcome: "draw" }).rank, null);
  assert.equal(submitScore({ ...base, outcome: "crash" }).rank, null);
  assert.equal(submitScore({ ...base, outcome: undefined }).rank, null);
  assert.equal(getScores().length, 0, "rejected rows never persist");
});

test("submitScore still accepts won and dead after rejects", () => {
  assert.equal(submitScore({ ...base, outcome: "won" }).rank, 1);
  assert.equal(submitScore({ ...base, score: 100, outcome: "dead" }).rank, 2);
  assert.deepEqual(
    getScores().map((s) => s.outcome),
    ["won", "dead"]
  );
});
