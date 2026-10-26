import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { getMeta, saveMeta } from "../src/meta.js";

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

const META_KEY = "neon-runner-meta-v2";

beforeEach(() => {
  globalThis.localStorage = new MemStorage();
});

test("saveMeta merges a patch and persists JSON under neon-runner-meta-v2", () => {
  const merged = saveMeta({ colorblind: true, forceReduceMotion: true });
  assert.equal(merged.colorblind, true);
  assert.equal(merged.forceReduceMotion, true);
  assert.equal(getMeta().colorblind, true);

  const raw = globalThis.localStorage.getItem(META_KEY);
  assert.ok(raw, "persisted after patch");
  const parsed = JSON.parse(raw);
  assert.equal(parsed.colorblind, true);
  assert.equal(parsed.forceReduceMotion, true);

  // Clear accessibility flags so later meta tests are not polluted.
  saveMeta({ colorblind: false, forceReduceMotion: null });
  assert.equal(getMeta().colorblind, false);
  assert.equal(getMeta().forceReduceMotion, null);
});
