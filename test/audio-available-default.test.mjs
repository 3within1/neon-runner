import { test } from "node:test";
import assert from "node:assert/strict";
import { isAudioAvailable, isMuted } from "../src/audio.js";

// Before any AudioContext attempt, the bus is considered available. A false
// default would hide the mute control and skip unlock gestures on first load.

test("isAudioAvailable is true before any context failure", () => {
  assert.equal(isAudioAvailable(), true);
  assert.equal(typeof isMuted(), "boolean");
});
