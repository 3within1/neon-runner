import { test } from "node:test";
import assert from "node:assert/strict";
import { WALL_SLIDE_SPEED } from "../src/constants.js";
import { capWallSlideFall } from "../src/physics.js";

/**
 * Slide cap requires wallCling > 0. A negative leftover after dt overshoot
 * (or a cleared grace that undershot) must not keep capping fall speed —
 * otherwise the runner floats down a wall they already left.
 */
test("capWallSlideFall ignores non-positive cling leftovers", () => {
  assert.equal(capWallSlideFall(800, -0.001, 1), 800);
  assert.equal(capWallSlideFall(800, 0, -1), 800);
  assert.equal(capWallSlideFall(800, 0.05, 1), WALL_SLIDE_SPEED, "positive cling still caps");
});
