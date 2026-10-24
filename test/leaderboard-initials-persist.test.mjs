import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { getLastInitials, setLastInitials } from "../src/leaderboard.js";

// Score-entry remembers the last tag across sessions. Broken persistence forces
// every submit back to the default RUN initials.

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
});

test("empty storage falls back to RUN initials", () => {
  assert.equal(getLastInitials(), "RUN");
});

test("setLastInitials normalizes and round-trips through storage", () => {
  assert.equal(setLastInitials("xy"), "XYX");
  assert.equal(getLastInitials(), "XYX");

  assert.equal(setLastInitials("a-1"), "A1X");
  assert.equal(getLastInitials(), "A1X");
});

test("setLastInitials rejects empty junk and stores the default", () => {
  assert.equal(setLastInitials("!!!"), "RUN");
  assert.equal(getLastInitials(), "RUN");
});
