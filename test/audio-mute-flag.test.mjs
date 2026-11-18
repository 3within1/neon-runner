import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { isMuted, setMuted, toggleMute } from "../src/audio.js";

// Mute is persisted under neon-runner-muted and gates SFX/music without needing
// an AudioContext. A broken flag leaves players with stuck silence or no mute.

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
  setMuted(false);
});

test("setMuted updates the in-memory flag and persists 0/1", () => {
  setMuted(true);
  assert.equal(isMuted(), true);
  assert.equal(globalThis.localStorage.getItem("neon-runner-muted"), "1");

  setMuted(false);
  assert.equal(isMuted(), false);
  assert.equal(globalThis.localStorage.getItem("neon-runner-muted"), "0");
});

test("toggleMute flips the flag and returns the new muted state", () => {
  setMuted(false);
  assert.equal(toggleMute(), true);
  assert.equal(isMuted(), true);
  assert.equal(toggleMute(), false);
  assert.equal(isMuted(), false);
});
