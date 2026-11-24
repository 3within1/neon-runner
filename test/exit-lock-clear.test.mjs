import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLevel, getLivingBoss, isExitLocked } from "../src/level.js";

/**
 * Boss-gated exits must unlock the moment the living boss dies. A sticky lock
 * soft-locks Ascender / Rex Core clears after a successful stomp chain.
 */
test("killing the Ascender sentinel unlocks the exit", () => {
  buildLevel(1);
  assert.equal(isExitLocked(), true);
  const boss = getLivingBoss();
  assert.ok(boss);
  assert.equal(boss.type, "towerSentinel");

  boss.alive = false;
  assert.equal(isExitLocked(), false, "dead sentinel clears the exit lock");
  assert.equal(getLivingBoss(), null);
});

test("killing Cyber-Rex unlocks the finale exit", () => {
  buildLevel(6);
  assert.equal(isExitLocked(), true);
  const boss = getLivingBoss();
  assert.ok(boss);
  assert.equal(boss.type, "rexBoss");

  boss.alive = false;
  assert.equal(isExitLocked(), false);
  assert.equal(getLivingBoss(), null);
});
