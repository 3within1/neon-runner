import { test } from "node:test";
import assert from "node:assert/strict";
import { REPLAY_SAMPLE_HZ } from "../src/constants.js";
import {
  clearReplay,
  player,
  pushReplaySample,
  sampleReplayAt,
} from "../src/state.js";

test("sampleReplayAt floors into sample indexes and clamps negative time", () => {
  clearReplay();
  for (const x of [10, 20, 30]) {
    player.x = x;
    player.y = 0;
    player.facing = 1;
    player.anim = "idle";
    player.frame = 0;
    player.dashTimer = 0;
    pushReplaySample();
  }

  assert.equal(sampleReplayAt(0).x, 10);
  assert.equal(
    sampleReplayAt(0.9 / REPLAY_SAMPLE_HZ).x,
    10,
    "sub-sample times stay on the earlier pose"
  );
  assert.equal(sampleReplayAt(1 / REPLAY_SAMPLE_HZ).x, 20);
  assert.equal(sampleReplayAt(2 / REPLAY_SAMPLE_HZ).x, 30);
  assert.equal(sampleReplayAt(-1).x, 10, "negative t clamps to the first sample");
});
