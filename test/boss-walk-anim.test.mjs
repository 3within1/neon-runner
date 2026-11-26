import { test } from "node:test";
import assert from "node:assert/strict";
import { advanceBossWalk } from "../src/physics.js";

test("advanceBossWalk speeds up while charging", () => {
  const dt = 0.1;
  const vx = 100;
  const idle = advanceBossWalk(0, dt, vx, 0);
  const charging = advanceBossWalk(0, dt, vx, 0.5);
  assert.ok(idle > 0);
  assert.ok(
    Math.abs(charging / idle - 2.2) < 1e-9,
    "charge multiplies walk advance by 2.2"
  );
});

test("advanceBossWalk scales with absolute horizontal speed", () => {
  const slow = advanceBossWalk(1, 0.05, 0, 0);
  const fast = advanceBossWalk(1, 0.05, -200, 0);
  assert.ok(fast > slow);
  assert.equal(advanceBossWalk(1, 0.05, 200, 0), fast, "|vx| is symmetric");
});
