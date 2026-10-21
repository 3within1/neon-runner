import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildLevel,
  getLevelCount,
  getLivingBoss,
  isExitLocked,
} from "../src/level.js";
import { configureRunMode, level } from "../src/state.js";

/**
 * Boss encounters must jack-in with full HP, phase announce reset, and a
 * locked exit. Sticky engaged/enrage/slam state from a prior run would skip
 * intro lines or unlock the door before the fight starts.
 */
test("boss sectors spawn a fresh living boss with the exit locked", () => {
  configureRunMode("normal");
  const n = getLevelCount();
  const finale = n - 1;

  buildLevel(1);
  const sentinel = getLivingBoss();
  assert.equal(sentinel?.type, "towerSentinel");
  assert.equal(sentinel.hp, sentinel.maxHp);
  assert.equal(sentinel.hp, 4);
  assert.equal(sentinel.engaged, false);
  assert.equal(sentinel.enrageAnnounced, false);
  assert.equal(sentinel.phaseAnnounced, 1);
  assert.equal(sentinel.slamTimer, 0);
  assert.equal(sentinel.airborne, false);
  assert.equal(sentinel.alive, true);
  assert.equal(isExitLocked(), true);

  buildLevel(finale);
  const rex = getLivingBoss();
  assert.equal(rex?.type, "rexBoss");
  assert.equal(rex.hp, rex.maxHp);
  assert.equal(rex.hp, 8);
  assert.equal(rex.engaged, false);
  assert.equal(rex.enrageAnnounced, false);
  assert.equal(rex.phaseAnnounced, 1);
  assert.equal(rex.charging, 0);
  assert.equal(rex.chargeCd, 0);
  assert.equal(isExitLocked(), true);

  // Killing the boss reference in-place must unlock; a rebuild restores the lock.
  rex.alive = false;
  assert.equal(getLivingBoss(), null);
  assert.equal(isExitLocked(), false);
  buildLevel(finale);
  assert.equal(isExitLocked(), true);
  assert.equal(getLivingBoss()?.alive, true);

  // Non-boss sectors stay unlocked with no living boss.
  buildLevel(0);
  assert.equal(getLivingBoss(), null);
  assert.equal(isExitLocked(), false);
  assert.ok(level.enemies.every((e) => !e.boss), "Grid Sprint has no boss flags");
});
