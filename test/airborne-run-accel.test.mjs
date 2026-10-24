import { test } from "node:test";
import assert from "node:assert/strict";
import { integrateRunVelocity } from "../src/physics.js";

// Airborne run uses weaker accel (2200) and friction (400) than ground (3200 /
// 2400). Matching ground values mid-air makes jumps feel sticky or floaty.

const dt = 1 / 60;

test("airborne accel is weaker than grounded accel into the same hold", () => {
  const air = integrateRunVelocity(0, {
    left: false,
    right: true,
    onGround: false,
    dt,
  });
  const ground = integrateRunVelocity(0, {
    left: false,
    right: true,
    onGround: true,
    dt,
  });
  assert.ok(air > 0 && ground > 0);
  assert.ok(air < ground, "air step must gain less speed than ground step");
});

test("airborne coast friction bleeds slower than grounded friction", () => {
  const start = 200;
  const step = 0.1; // ground friction 2400*0.1 dumps 200; air 400*0.1 leaves 160
  const airCoast = integrateRunVelocity(start, {
    left: false,
    right: false,
    onGround: false,
    dt: step,
  });
  const groundCoast = integrateRunVelocity(start, {
    left: false,
    right: false,
    onGround: true,
    dt: step,
  });
  assert.equal(groundCoast, 0, "ground friction clears 200 px/s in 0.1s");
  assert.ok(airCoast > 0, "air friction must leave residual vx over the same dt");
  assert.ok(Math.abs(airCoast - 160) < 1e-9, "air friction is 400 px/s²");
});
