import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { getLastInitials, setLastInitials } from "../src/leaderboard.js";

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

test("setLastInitials persists normalized initials for the next entry form", () => {
  assert.equal(getLastInitials(), "RUN", "empty storage falls back to default");
  assert.equal(setLastInitials("ab"), "ABX");
  assert.equal(getLastInitials(), "ABX");
  assert.equal(setLastInitials("!!!"), "RUN");
  assert.equal(getLastInitials(), "RUN");
});
