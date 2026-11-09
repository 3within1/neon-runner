import { test } from "node:test";
import assert from "node:assert/strict";
import { projectileCanHurtPlayer } from "../src/level.js";

/**
 * Hurt gate is `!(invuln > 0)`. NaN comparisons are false, so a poisoned
 * invuln timer does not grant bolt immunity — complementary to the negative
 * leftover canary and the finite/Infinity decay path in tickInvuln.
 */
test("projectileCanHurtPlayer treats NaN invuln as vulnerable", () => {
  assert.equal(projectileCanHurtPlayer(Number.NaN), true);
  assert.equal(projectileCanHurtPlayer(0), true);
  assert.equal(projectileCanHurtPlayer(0.2), false);
  assert.equal(projectileCanHurtPlayer(Infinity), false, "death-replay invuln still blocks");
});
