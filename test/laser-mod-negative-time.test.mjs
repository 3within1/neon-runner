import { test } from "node:test";
import assert from "node:assert/strict";
import { isLaserHazardOn } from "../src/level.js";

test("isLaserHazardOn keeps negative wall-clock leftovers in the on window via JS %", () => {
  const period = 1.2;
  // JS remainder keeps the dividend sign, so t = -0.1 stays < 0.45*period.
  assert.equal(isLaserHazardOn(-0.1, 0, period), true);
  assert.equal(
    isLaserHazardOn(period - 0.1, 0, period),
    false,
    "positive wrap into the off window is not equivalent to a negative leftover"
  );
});
