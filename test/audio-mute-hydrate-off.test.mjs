import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * Companion to audio-mute-hydrate.test.mjs: Node caches the audio module per
 * process, so the unmuted / non-"1" boot path needs its own file.
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

test("audio stays unmuted when mute key is missing or not exactly '1'", async () => {
  globalThis.localStorage = memStorage({ "neon-runner-muted": "0" });

  const { isMuted } = await import("../src/audio.js");
  assert.equal(isMuted(), false, "only the literal '1' flag mutes on hydrate");
});
