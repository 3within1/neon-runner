import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { considerScoreUnlocks, getMeta, saveMeta } from "../src/meta.js";

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
  saveMeta({ unlockedSkins: ["default"] });
});

test("considerScoreUnlocks awards signal once and ignores sub-threshold scores", () => {
  considerScoreUnlocks(499);
  assert.equal(getMeta().unlockedSkins.includes("signal"), false);

  considerScoreUnlocks(500);
  assert.equal(getMeta().unlockedSkins.includes("signal"), true);
  assert.equal(
    getMeta().unlockedSkins.filter((id) => id === "signal").length,
    1,
    "first unlock inserts once"
  );

  considerScoreUnlocks(900);
  assert.equal(
    getMeta().unlockedSkins.filter((id) => id === "signal").length,
    1,
    "repeat unlocks must not duplicate the skin id"
  );
});
