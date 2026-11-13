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
  sector: 3,
  coins: 0,
  stomps: 0,
  durationSec: 40,
  ...extra,
});

test("isHighScore lets a full-clear displace equal-DATA crash on a full board", () => {
  for (let i = 0; i < 10; i++) {
    submitScore(run(250, { initials: `D${i}`, durationSec: 40 }));
  }

  assert.equal(
    isHighScore(run(250, { outcome: "won", sector: 5, durationSec: 40 })),
    true,
    "won must outrank dead at the same DATA total"
  );
  assert.equal(
    isHighScore(run(250, { outcome: "dead", durationSec: 40 })),
    false,
    "another equal dead crash stays off the full board"
  );
});
