import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildLevel,
  getLevelCount,
  getLivingBoss,
  isExitLocked,
} from "../src/level.js";

// Exit jack-in is gated on a living boss. If death does not clear the lock,
// players soft-lock at the sector door after a successful fight.

test("sectors without a boss leave the exit unlocked", () => {
  buildLevel(0);
  assert.equal(getLivingBoss(), null);
  assert.equal(isExitLocked(), false);
});

test("killing Ascender sentinel unlocks the exit", () => {
  buildLevel(1);
  const boss = getLivingBoss();
  assert.ok(boss, "Ascender ships with Tower Sentinel");
  assert.equal(boss.type, "towerSentinel");
  assert.equal(isExitLocked(), true);

  boss.alive = false;
  assert.equal(getLivingBoss(), null);
  assert.equal(isExitLocked(), false, "dead boss must open the jack-in");
});

test("finale Cyber-Rex keeps the exit locked until defeated", () => {
  const finale = getLevelCount() - 1;
  buildLevel(finale);
  const boss = getLivingBoss();
  assert.ok(boss, "Rex Core ships with a living boss");
  assert.equal(isExitLocked(), true);

  boss.alive = false;
  assert.equal(isExitLocked(), false);
});
