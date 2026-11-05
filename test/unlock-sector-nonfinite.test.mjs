import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { getUnlockedSector, unlockSector, saveMeta } from "../src/meta.js";

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
  saveMeta({ unlockedSector: 3 });
});

test("unlockSector ignores NaN and never rolls progress backward", () => {
  assert.equal(getUnlockedSector(), 3);
  assert.equal(unlockSector(Number.NaN), 3, "NaN must not rewrite unlockedSector");
  assert.equal(getUnlockedSector(), 3);

  assert.equal(unlockSector(-5), 3, "negative indexes must not decrease unlocks");
  assert.equal(getUnlockedSector(), 3);

  assert.equal(unlockSector(5), 5);
  assert.equal(getUnlockedSector(), 5);
});
