import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { isHighScore, submitScore } from "../src/leaderboard.js";

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

const run = (score, extra = {}) => ({
  score,
  outcome: "dead",
  sector: 1,
  coins: 0,
  stomps: 0,
  durationSec: 50,
  ...extra,
});

test("isHighScore lets a faster equal-score run displace the 10th seat", () => {
  for (let i = 0; i < 10; i++) {
    submitScore(run(100, { durationSec: 50, initials: `A${i}` }));
  }

  assert.equal(
    isHighScore(run(100, { durationSec: 20 })),
    true,
    "same DATA but faster duration must still place"
  );
  assert.equal(
    isHighScore(run(100, { durationSec: 90 })),
    false,
    "same DATA but slower duration stays off a full board"
  );
});
