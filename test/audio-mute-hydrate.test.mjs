import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * audio.js hydrates `muted` once at import from neon-runner-muted.
 * Seed storage before the dynamic import — a static import would miss the boot path
 * and leave returning players stuck silent (or unmuted) after a refresh.
 * This file must not statically import audio.js (or modules that pull it in).
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

test("audio hydrates muted=true when neon-runner-muted is '1' before import", async () => {
  globalThis.localStorage = memStorage({ "neon-runner-muted": "1" });

  const { isMuted } = await import("../src/audio.js");
  assert.equal(isMuted(), true, "returning mute preference applies on boot");
});
