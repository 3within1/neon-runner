import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldApplyRunClamp } from "../src/physics.js";

/**
 * Canary for the current `dashTimer <= 0` contract: NaN comparisons are always
 * false, so a poisoned dash timer skips the run clamp and can leave dash-speed
 * vx stuck on. Documents the footgun until the gate hardens to `!(dashTimer > 0)`.
 */
test("shouldApplyRunClamp currently skips the run path when dashTimer is NaN", () => {
  assert.equal(shouldApplyRunClamp(Number.NaN), false);
  assert.equal(shouldApplyRunClamp(0), true, "zero still allows the clamp");
  assert.equal(shouldApplyRunClamp(0.1), false, "active dash still blocks the clamp");
});
