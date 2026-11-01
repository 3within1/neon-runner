import { test } from "node:test";
import assert from "node:assert/strict";
import { integrateRunVelocity } from "../src/physics.js";

// maxSpeed is an optional override (no call site passes one yet). The default
// 280 clamp must not silently win over an explicit lower cap.

test("integrateRunVelocity respects a custom maxSpeed below the default", () => {
  const stepped = integrateRunVelocity(0, {
    left: false,
    right: true,
    onGround: true,
    dt: 1,
    maxSpeed: 100,
  });
  assert.equal(stepped, 100, "accel from rest over 1s saturates at custom cap");

  const crushed = integrateRunVelocity(250, {
    left: false,
    right: true,
    onGround: true,
    dt: 1 / 60,
    maxSpeed: 100,
  });
  assert.equal(crushed, 100, "existing vx above the cap is clamped immediately");
});

test("integrateRunVelocity custom maxSpeed also clamps leftward motion", () => {
  const left = integrateRunVelocity(0, {
    left: true,
    right: false,
    onGround: true,
    dt: 1,
    maxSpeed: 120,
  });
  assert.equal(left, -120);
});
