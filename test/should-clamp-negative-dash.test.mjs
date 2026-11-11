import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldApplyRunClamp } from "../src/physics.js";

/**
 * Run clamp must stay off only while dashTimer is strictly positive. A negative
 * leftover (timer overshoot after dt) must still allow the run path so the
 * runner does not keep dash-speed forever.
 */
test("shouldApplyRunClamp treats zero and negative dash timers as idle", () => {
  assert.equal(shouldApplyRunClamp(0), true);
  assert.equal(shouldApplyRunClamp(-0.001), true);
  assert.equal(shouldApplyRunClamp(-1), true);
  assert.equal(shouldApplyRunClamp(0.0001), false, "any positive dash blocks the clamp");
});
