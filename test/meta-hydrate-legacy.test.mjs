import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * Own process (Node --test file isolation) so meta.js hydrates from this seed.
 */

function memStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      map.set(k, String(v));
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

test("meta load treats hasCleared legacy saves without unlockedSector as fully unlocked", async () => {
  globalThis.localStorage = memStorage({
    "neon-runner-meta-v2": JSON.stringify({
      hasCleared: true,
      unlockedSkins: ["default"],
    }),
  });

  const { getMeta, getUnlockedSector } = await import("../src/meta.js");
  assert.equal(getMeta().hasCleared, true);
  assert.equal(getUnlockedSector(), 99, "legacy clear unlocks every campaign sector");
});
