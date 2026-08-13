import { test } from "node:test";
import assert from "node:assert/strict";
import { isLaserHazardOn } from "../src/level.js";

test("isLaserHazardOn is active for the first 45% of each period", () => {
  const period = 1.2;
  assert.equal(isLaserHazardOn(0, 0, period), true);
  assert.equal(isLaserHazardOn(period * 0.44, 0, period), true);
  assert.equal(isLaserHazardOn(period * 0.45, 0, period), false);
  assert.equal(isLaserHazardOn(period * 0.9, 0, period), false);
});

test("isLaserHazardOn wraps across period boundaries", () => {
  const period = 1.0;
  assert.equal(isLaserHazardOn(1.0, 0, period), true, "exactly one period resets to on");
  assert.equal(isLaserHazardOn(1.4, 0, period), true);
  // Stay clear of the 0.45 boundary — `1.45 % 1` is float-noisy in JS.
  assert.equal(isLaserHazardOn(1.5, 0, period), false);
});

test("isLaserHazardOn respects phase offset and default period", () => {
  // phase 0.5 with period 1.2 shifts the window by 0.6s
  assert.equal(isLaserHazardOn(0, 0.5, 1.2), false);
  assert.equal(isLaserHazardOn(0.6, 0.5, 1.2), true);
  assert.equal(isLaserHazardOn(0, 0), true, "default period keeps lasers on at t=0");
});
