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

/**
 * Death-replay presentation advances via addReplayElapsed. A broken accumulator
 * never reaches the 2s handoff and strands the runner on the replay screen.
 */
test("addReplayElapsed accumulates and returns the running total", () => {
  clearReplay();
  player.x = 0;
  player.y = 0;
  player.facing = 1;
  player.anim = "idle";
  player.frame = 0;
  player.dashTimer = 0;
  pushReplaySample();
  beginReplayPlayback();

  assert.equal(replayElapsed, 0);
  assert.equal(addReplayElapsed(0.5), 0.5);
  assert.equal(replayElapsed, 0.5);
  assert.equal(addReplayElapsed(1.25), 1.75);
  assert.equal(replayElapsed, 1.75);
  assert.ok(replayElapsed < 2, "still under the death-replay handoff threshold");
  assert.equal(addReplayElapsed(0.5), 2.25);
  assert.ok(replayElapsed >= 2, "crosses the handoff threshold");
});
