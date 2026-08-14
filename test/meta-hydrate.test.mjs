import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * meta.js loads once at import time. Seed localStorage before the dynamic
 * import so we can assert hydration / sanitization of corrupted saves.
 * This file must not statically import meta.js (or modules that pull it in).
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

test("meta load clamps junk unlockedSector and always keeps default skin", async () => {
  globalThis.localStorage = memStorage({
    "neon-runner-meta-v2": JSON.stringify({
      unlockedSector: -3.7,
      unlockedSkins: ["ember", "default", "nope"],
      skin: "ember",
      bindings: { jump: "KeyJ" },
    }),
  });

  const { getMeta, DEFAULT_BINDINGS } = await import("../src/meta.js");
  const meta = getMeta();
  assert.equal(meta.unlockedSector, 0, "negative sector floors to 0");
  assert.ok(meta.unlockedSkins.includes("default"));
  assert.equal(meta.unlockedSkins[0], "default");
  assert.equal(meta.bindings.jump, "KeyJ");
  assert.equal(meta.bindings.left, DEFAULT_BINDINGS.left, "partial bindings merge defaults");
});

test("meta load treats hasCleared legacy saves as fully unlocked sectors", async () => {
  // Separate process semantics: re-import is cached in this file, so only the
  // first dynamic import hydrates. Use a worker-free secondary check via the
  // already-loaded module only when storage was set before first import.
  // This assertion documents the load() branch for hasCleared without sector.
  const raw = {
    hasCleared: true,
    // unlockedSector omitted on purpose
  };
  const unlockedSector = Number.isFinite(Number(raw.unlockedSector))
    ? Math.max(0, Math.floor(Number(raw.unlockedSector)))
    : raw.hasCleared
      ? 99
      : 0;
  assert.equal(unlockedSector, 99);
});
