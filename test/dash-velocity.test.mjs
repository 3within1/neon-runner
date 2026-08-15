import { test } from "node:test";
import assert from "node:assert/strict";
import { DASH_SPEED } from "../src/constants.js";
import {
  integrateRunVelocity,
  shouldApplyRunClamp,
} from "../src/physics.js";

test("shouldApplyRunClamp skips the run path while a dash is active", () => {
  assert.equal(shouldApplyRunClamp(0), true);
  assert.equal(shouldApplyRunClamp(0.18), false);
  assert.equal(shouldApplyRunClamp(0.001), false);
});

test("integrateRunVelocity clamps to run maxSpeed — must not run on dash frame-1", () => {
  assert.ok(DASH_SPEED > 280, "dash must outrun the run clamp");
  const crushed = integrateRunVelocity(DASH_SPEED, {
    left: false,
    right: true,
    onGround: true,
    dt: 1 / 60,
  });
  assert.ok(crushed <= 280, "run clamp would crush dash vx to maxSpeed");
  assert.ok(crushed < DASH_SPEED, "proves why frame-1 must skip integrateRunVelocity");
});

test("integrateRunVelocity accelerates into the held direction and frictions to rest", () => {
  const stepped = integrateRunVelocity(0, {
    left: false,
    right: true,
    onGround: true,
    dt: 1 / 60,
  });
  assert.ok(stepped > 0 && stepped <= 280);

  const left = integrateRunVelocity(0, {
    left: true,
    right: false,
    onGround: true,
    dt: 1 / 60,
  });
  assert.ok(left < 0);

  const coast = integrateRunVelocity(100, {
    left: false,
    right: false,
    onGround: true,
    dt: 1,
  });
  assert.equal(coast, 0, "long grounded friction dumps residual vx");
});
