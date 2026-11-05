import { test } from "node:test";
import assert from "node:assert/strict";
import { integrateRunVelocity } from "../src/physics.js";

test("integrateRunVelocity applies much weaker friction while airborne", () => {
  const opts = { left: false, right: false, dt: 0.1, maxSpeed: 280 };
  const grounded = integrateRunVelocity(200, { ...opts, onGround: true });
  const airborne = integrateRunVelocity(200, { ...opts, onGround: false });

  // Ground friction 2400*0.1 = 240 → clamp to 0 after sign flip; air 400*0.1 = 40.
  assert.equal(grounded, 0, "0.1s of grounded friction dumps 200 vx");
  assert.ok(Math.abs(airborne - 160) < 1e-9, "air friction leaves residual vx");
  assert.ok(airborne > grounded, "air control must coast farther than ground stop");
});
