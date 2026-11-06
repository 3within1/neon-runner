import { test } from "node:test";
import assert from "node:assert/strict";
import { getSectorBestTime, recordSectorTime } from "../src/meta.js";

/**
 * HUD / trial select read getSectorBestTime for every campaign index. Sparse
 * arrays and out-of-range indexes must read as "no best" (0), never undefined.
 */
test("getSectorBestTime returns 0 for unset and out-of-range indexes", () => {
  assert.equal(getSectorBestTime(0), 0, "fresh meta has no sector 0 best");
  assert.equal(getSectorBestTime(99), 0, "far past bestTimes length");
  assert.equal(getSectorBestTime(-1), 0, "negative index is a miss");

  recordSectorTime(1, 22);
  assert.equal(getSectorBestTime(1), 22);
  assert.equal(getSectorBestTime(2), 0, "neighbor slot stays empty");
});
