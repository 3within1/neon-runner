import { test } from "node:test";
import assert from "node:assert/strict";
import { integrateRunVelocity } from "../src/physics.js";

test("integrateRunVelocity applies weaker air friction than grounded friction", () => {
  const opts = { left: false, right: false, dt: 1 / 60 };
  const air = integrateRunVelocity(200, { ...opts, onGround: false });
  const ground = integrateRunVelocity(200, { ...opts, onGround: true });
  assert.ok(air > ground, "air retains more residual vx over the same dt");
  assert.ok(air < 200 && ground < 200, "both still bleed speed");
});

test("integrateRunVelocity air accel is weaker than grounded accel", () => {
  const opts = { left: false, right: true, dt: 1 / 60 };
  const air = integrateRunVelocity(0, { ...opts, onGround: false });
  const ground = integrateRunVelocity(0, { ...opts, onGround: true });
  assert.ok(ground > air, "ground accelerates harder into a held direction");
  assert.ok(air > 0 && ground > 0);
});
