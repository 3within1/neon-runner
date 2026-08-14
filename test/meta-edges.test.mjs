import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getBestClearTime,
  getSectorBestTime,
  recordClearTime,
  recordSectorTime,
} from "../src/meta.js";

// Complementary to the happy-path meta tests: invalid inputs must not corrupt
// best-time state (Time Trial / clear tracking).

test("recordClearTime rejects non-positive and non-finite durations", () => {
  const before = getBestClearTime();
  assert.equal(recordClearTime(0), before);
  assert.equal(recordClearTime(-12), before);
  assert.equal(recordClearTime(Number.NaN), before);
  assert.equal(recordClearTime(Number.POSITIVE_INFINITY), before);
  assert.equal(getBestClearTime(), before, "best clear unchanged by junk input");
});

test("recordSectorTime rejects non-positive seconds and negative indices", () => {
  const rejected = recordSectorTime(0, 0);
  assert.equal(rejected.improved, false);
  assert.equal(rejected.best, Infinity);

  assert.equal(recordSectorTime(-1, 12).improved, false);
  assert.equal(recordSectorTime(2, -5).improved, false);

  // A valid write still works after rejects (guards against sticky bad state).
  const ok = recordSectorTime(2, 33);
  assert.equal(ok.improved, true);
  assert.equal(ok.best, 33);
  assert.equal(getSectorBestTime(2), 33);
});
