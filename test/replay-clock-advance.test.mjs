import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addReplayElapsed,
  beginReplayPlayback,
  clearReplay,
  player,
  pushReplaySample,
  replayElapsed,
} from "../src/state.js";

test("beginReplayPlayback zeroes elapsed and addReplayElapsed returns the cumulative clock", () => {
  clearReplay();
  player.x = 1;
  player.y = 2;
  player.facing = 1;
  player.anim = "idle";
  player.frame = 0;
  player.dashTimer = 0;
  pushReplaySample();

  beginReplayPlayback();
  assert.equal(replayElapsed, 0);

  assert.equal(addReplayElapsed(0.016), 0.016);
  assert.equal(replayElapsed, 0.016);
  assert.equal(addReplayElapsed(0.016), 0.032);
  assert.equal(replayElapsed, 0.032);
});
