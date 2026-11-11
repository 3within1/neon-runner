import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addReplayElapsed,
  clearReplay,
  player,
  pushReplaySample,
  replayElapsed,
  sampleReplayAt,
} from "../src/state.js";

test("addReplayElapsed accumulates the death-replay clock", () => {
  clearReplay();
  assert.equal(addReplayElapsed(0.1), 0.1);
  assert.equal(addReplayElapsed(0.25), 0.35);
  assert.equal(replayElapsed, 0.35);
});

test("sampleReplayAt clamps past the recorded window to the newest sample", () => {
  clearReplay();
  for (let i = 0; i < 5; i++) {
    player.x = i * 10;
    player.y = 0;
    player.facing = 1;
    player.anim = "run";
    player.frame = 0;
    player.dashTimer = 0;
    pushReplaySample();
  }
  const last = sampleReplayAt(99);
  assert.ok(last);
  assert.equal(last.x, 40, "overshoot reads the newest kept pose");
});
