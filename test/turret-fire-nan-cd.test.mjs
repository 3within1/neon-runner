import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import { turretCanFire } from "../src/level.js";

/**
 * Fire gate is `fireCd <= 0`. NaN fails that check, so a poisoned cooldown
 * permanently silences the turret — complementary to the negative-overshoot
 * ready path. Documents the asymmetry until the gate hardens.
 */
test("turretCanFire treats NaN cooldown as not ready", () => {
  assert.equal(turretCanFire(Number.NaN, TILE * 5, 0), false);
  assert.equal(turretCanFire(0, TILE * 5, 0), true);
  assert.equal(turretCanFire(-0.01, TILE * 5, 0), true, "negative leftover stays ready");
});
