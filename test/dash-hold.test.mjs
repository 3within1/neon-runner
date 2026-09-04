import { test } from "node:test";
import assert from "node:assert/strict";
import { DASH_SPEED } from "../src/constants.js";
import { dashStartVertical, holdDashVelocity } from "../src/physics.js";

test("holdDashVelocity locks full dash speed with zero vertical", () => {
  assert.deepEqual(holdDashVelocity(1), { vx: DASH_SPEED, vy: 0 });
  assert.deepEqual(holdDashVelocity(-1), { vx: -DASH_SPEED, vy: 0 });
  assert.deepEqual(holdDashVelocity(1, 500), { vx: 500, vy: 0 });
});

test("dashStartVertical cancels downward fall but keeps upward jump", () => {
  assert.equal(dashStartVertical(900), 0, "falling dash starts level");
  assert.equal(dashStartVertical(0), 0);
  assert.equal(dashStartVertical(-400), -400, "mid-jump dash keeps upward vy");
});
