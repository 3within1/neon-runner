import { test } from "node:test";
import assert from "node:assert/strict";
import { isLaserHazardOn } from "../src/level.js";

// `period || 1.2` must rescue a 0 / falsy authoring typo so `% 0` never NaNs
// the laser duty-cycle (which would leave lasers stuck off or always on).

test("isLaserHazardOn treats a zero period as the 1.2s default", () => {
  assert.equal(isLaserHazardOn(0, 0, 0), true, "t=0 is in the default on-window");
  assert.equal(isLaserHazardOn(0.5, 0, 0), true, "mid default on-window still on");
  assert.equal(isLaserHazardOn(0.6, 0, 0), false, "past 45% of the 1.2s fallback");
  assert.equal(isLaserHazardOn(0, 0, null), true, "null period also falls back");
});
