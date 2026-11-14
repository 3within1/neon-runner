import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { getScores } from "../src/leaderboard.js";

const STORAGE_KEY = "neon-runner-scores-v3";

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

test("getScores clamps sector to 1..99 and floors fractional sectors", () => {
  globalThis.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([
      {
        score: 50,
        initials: "LO",
        outcome: "dead",
        at: "2026-01-01T00:00:00.000Z",
        sector: 0,
      },
      {
        score: 60,
        initials: "HI",
        outcome: "won",
        at: "2026-01-02T00:00:00.000Z",
        sector: 200,
      },
      {
        score: 55,
        initials: "FR",
        outcome: "dead",
        at: "2026-01-03T00:00:00.000Z",
        sector: 3.9,
      },
    ])
  );
  const scores = getScores();
  assert.equal(scores.length, 3);
  const byInitials = Object.fromEntries(scores.map((s) => [s.initials, s]));
  assert.equal(byInitials.LOX.sector, 1, "sector 0 clamps up to 1");
  assert.equal(byInitials.HIX.sector, 99, "sector 200 clamps down to 99");
  assert.equal(byInitials.FRX.sector, 3, "fractional sector floors");
});

test("getScores floors coins/stomps and clamps negative duration to zero", () => {
  globalThis.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([
      {
        score: 100,
        initials: "OK",
        outcome: "won",
        at: "2026-01-01T00:00:00.000Z",
        sector: 5,
        coins: 2.9,
        stomps: -3,
        durationSec: -12,
      },
    ])
  );
  const [row] = getScores();
  assert.equal(row.coins, 2, "coins floor to a non-negative int");
  assert.equal(row.stomps, 0, "negative stomps clamp to 0");
  assert.equal(row.durationSec, 0, "negative duration clamps to 0");
  assert.equal(row.v, 3, "schema version stamped on read");
});
