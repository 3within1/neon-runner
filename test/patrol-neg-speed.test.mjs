import { test } from "node:test";
import assert from "node:assert/strict";
import { stepPatrol1D } from "../src/level.js";

/**
 * Bounce branches use Math.abs(speed). A negative authored speed (or a
 * sign-flipped baseSpeed after lockdown mult quirks) must still reverse cleanly
 * instead of sticking at the bound with vel=0 / wrong sign.
 */
test("stepPatrol1D bounce uses absolute speed when speed is negative", () => {
  const low = stepPatrol1D(5, 40, -80, 0, 400, -80, 0.1);
  assert.equal(low.pos, 0);
  assert.equal(low.vel, 80, "low bound kicks toward +abs(speed)");

  const high = stepPatrol1D(370, 40, 80, 0, 400, -80, 0.1);
  assert.equal(high.pos, 360);
  assert.equal(high.vel, -80, "high bound kicks toward -abs(speed)");
});
