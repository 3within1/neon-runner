import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import { turretCanFire } from "../src/level.js";

/**
 * After a fire, cooldown decays by dt and can overshoot slightly below zero.
 * A negative leftover must still count as ready — otherwise turrets stall until
 * the next exact zero crossing.
 */
test("turretCanFire treats negative cooldown leftovers as ready", () => {
  assert.equal(turretCanFire(-0.001, TILE * 5, 0), true);
  assert.equal(turretCanFire(-1, TILE * 5, 0), true);
  assert.equal(turretCanFire(0.001, TILE * 5, 0), false, "any positive cd still blocks");
});
