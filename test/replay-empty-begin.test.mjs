import { test } from "node:test";
import assert from "node:assert/strict";
import {
  beginReplayPlayback,
  clearReplay,
  replayCount,
  replayDuration,
  replayElapsed,
  sampleReplayAt,
} from "../src/state.js";

/**
 * Instant deaths before any sample was pushed must still enter replay with a
 * zero-length buffer so finalizeReplayIfDone can hand off immediately.
 */
test("beginReplayPlayback on an empty buffer yields zero duration", () => {
  clearReplay();
  assert.equal(replayCount, 0);

  beginReplayPlayback();
  assert.equal(replayDuration, 0);
  assert.equal(replayElapsed, 0);
  assert.equal(sampleReplayAt(0), null, "no pose to sample");
});
