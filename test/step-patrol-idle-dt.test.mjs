import { test } from "node:test";
import assert from "node:assert/strict";
import { stepPatrol1D } from "../src/level.js";

test("stepPatrol1D with dt 0 leaves position and velocity unchanged near bounds", () => {
  const atMin = stepPatrol1D(10, 20, -40, 10, 200, 40, 0);
  assert.deepEqual(atMin, { pos: 10, vel: -40 });

  const atMax = stepPatrol1D(180, 20, 40, 10, 200, 40, 0);
  assert.deepEqual(atMax, { pos: 180, vel: 40 });

  const mid = stepPatrol1D(100, 20, 40, 10, 200, 40, 0);
  assert.deepEqual(mid, { pos: 100, vel: 40 });
});
