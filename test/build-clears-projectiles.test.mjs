import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLevel } from "../src/level.js";
import { configureRunMode, level } from "../src/state.js";

/**
 * Sector transitions and retries must wipe leftover turret bolts. Sticky
 * projectiles from a prior build would hit the runner on jack-in.
 */
test("buildLevel clears leftover projectiles from a prior sector", () => {
  configureRunMode("lockdown");
  buildLevel(2);
  level.projectiles = [
    { x: 10, y: 10, w: 22, h: 12, vx: 260, vy: 0, life: 2.6 },
    { x: 40, y: 20, w: 22, h: 12, vx: -260, vy: 0, life: 1.0 },
  ];
  assert.equal(level.projectiles.length, 2);

  buildLevel(3);
  assert.ok(Array.isArray(level.projectiles), "projectiles array exists after build");
  assert.equal(level.projectiles.length, 0, "prior bolts must not survive rebuild");

  buildLevel(0);
  assert.equal(level.projectiles.length, 0, "Grid Sprint also starts with an empty bolt list");
});
