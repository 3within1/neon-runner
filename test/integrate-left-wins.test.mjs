import { test } from "node:test";
import assert from "node:assert/strict";
import { integrateRunVelocity } from "../src/physics.js";

// Physics resolves opposing holds as left-first. Input normally clears the
// conflict via lastDir; if both flags ever leak through, motion must stay
// deterministic (no flicker / NaN from dual accel).

test("integrateRunVelocity prefers left when both directions are held", () => {
  const both = integrateRunVelocity(0, {
    left: true,
    right: true,
    onGround: true,
    dt: 1 / 60,
  });
  const leftOnly = integrateRunVelocity(0, {
    left: true,
    right: false,
    onGround: true,
    dt: 1 / 60,
  });
  assert.ok(both < 0);
  assert.equal(both, leftOnly);
});
