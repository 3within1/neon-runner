import { test } from "node:test";
import assert from "node:assert/strict";
import { stepPatrol1D } from "../src/level.js";

/**
 * Spawn / lockdown speed mult can place a drone already past its authored
 * patrol lip for one frame. The first step must snap back onto the bound and
 * reverse — not walk further into empty air.
 */
test("stepPatrol1D snaps back when already past the low bound", () => {
  const hit = stepPatrol1D(-20, 40, -80, 0, 400, 80, 0.1);
  assert.equal(hit.pos, 0);
  assert.equal(hit.vel, 80);
});

test("stepPatrol1D snaps back when already past the high bound", () => {
  const hit = stepPatrol1D(500, 40, 80, 0, 400, 80, 0.1);
  assert.equal(hit.pos, 360, "max - size");
  assert.equal(hit.vel, -80);
});
