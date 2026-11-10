import { test } from "node:test";
import assert from "node:assert/strict";
import { projectileCanHurtPlayer } from "../src/level.js";

/**
 * Invuln decay can overshoot to a tiny negative before the next frame clamps it.
 * Bolts must hurt again once the timer is no longer strictly positive — otherwise
 * a float leftover would grant permanent projectile immunity.
 */
test("projectileCanHurtPlayer allows hits when invuln is zero or negative", () => {
  assert.equal(projectileCanHurtPlayer(0), true);
  assert.equal(projectileCanHurtPlayer(-0.001), true);
  assert.equal(projectileCanHurtPlayer(-1), true);
  assert.equal(projectileCanHurtPlayer(0.001), false, "any positive invuln still blocks");
});
