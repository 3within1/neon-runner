import { test } from "node:test";
import assert from "node:assert/strict";
import { integrateRunVelocity } from "../src/physics.js";

/**
 * A zero-dt integration (hit-stop / paused substep) must not invent accel or
 * friction. Residual vx stays put and stays inside the maxSpeed clamp.
 */
test("integrateRunVelocity is a no-op at dt 0 aside from maxSpeed clamp", () => {
  assert.equal(
    integrateRunVelocity(120, { left: false, right: true, onGround: true, dt: 0 }),
    120
  );
  assert.equal(
    integrateRunVelocity(-80, { left: true, right: false, onGround: false, dt: 0 }),
    -80
  );
  assert.equal(
    integrateRunVelocity(500, { left: false, right: false, onGround: true, dt: 0 }),
    280,
    "over-speed still clamps even at dt 0"
  );
});
