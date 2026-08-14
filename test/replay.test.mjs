import { test } from "node:test";
import assert from "node:assert/strict";
import { REPLAY_SAMPLE_HZ, REPLAY_SECONDS } from "../src/constants.js";
import {
  beginReplayPlayback,
  clearReplay,
  player,
  pushReplaySample,
  replayCount,
  replayDuration,
  sampleReplayAt,
} from "../src/state.js";

test("pushReplaySample records pose and sampleReplayAt reads from the start", () => {
  clearReplay();
  player.x = 10;
  player.y = 20;
  player.facing = 1;
  player.anim = "run";
  player.frame = 2;
  player.dashTimer = 0;
  pushReplaySample();

  player.x = 99;
  player.y = 88;
  player.facing = -1;
  player.anim = "jump";
  player.frame = 0;
  player.dashTimer = 0.1;
  pushReplaySample();

  assert.equal(replayCount, 2);
  const first = sampleReplayAt(0);
  assert.ok(first);
  assert.equal(first.x, 10);
  assert.equal(first.y, 20);
  assert.equal(first.facing, 1);
  assert.equal(first.anim, "run");
  assert.equal(first.dash, false);

  const second = sampleReplayAt(1 / REPLAY_SAMPLE_HZ);
  assert.ok(second);
  assert.equal(second.x, 99);
  assert.equal(second.facing, -1);
  assert.equal(second.dash, true);
});

test("sampleReplayAt returns null when the buffer is empty", () => {
  clearReplay();
  assert.equal(sampleReplayAt(0), null);
});

test("ring buffer wraps and keeps only the newest REPLAY_LEN samples", () => {
  clearReplay();
  const capacity = Math.ceil(REPLAY_SECONDS * REPLAY_SAMPLE_HZ);
  for (let i = 0; i < capacity + 5; i++) {
    player.x = i;
    player.y = 0;
    player.facing = 1;
    player.anim = "idle";
    player.frame = 0;
    player.dashTimer = 0;
    pushReplaySample();
  }
  assert.equal(replayCount, capacity, "count clamps to ring capacity");
  const oldestKept = sampleReplayAt(0);
  assert.ok(oldestKept);
  assert.equal(oldestKept.x, 5, "samples before the wrap are dropped");
  const newest = sampleReplayAt(REPLAY_SECONDS);
  assert.ok(newest);
  assert.equal(newest.x, capacity + 4, "latest write remains readable");
});

test("beginReplayPlayback caps duration by recorded samples", () => {
  clearReplay();
  for (let i = 0; i < 30; i++) {
    player.x = i;
    player.y = 0;
    player.facing = 1;
    player.anim = "idle";
    player.frame = 0;
    player.dashTimer = 0;
    pushReplaySample();
  }
  beginReplayPlayback();
  assert.equal(replayDuration, 30 / REPLAY_SAMPLE_HZ);
  assert.ok(replayDuration < REPLAY_SECONDS);
});
