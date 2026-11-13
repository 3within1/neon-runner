import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLevel, getLivingBoss, isExitLocked } from "../src/level.js";

// Boss sectors gate the jack-in exit while a living boss remains. Clearing
// alive must unlock immediately so the runner is not soft-locked after the kill.

test("isExitLocked tracks living boss state on Ascender", () => {
  buildLevel(1);
  const boss = getLivingBoss();
  assert.ok(boss, "Ascender spawns Tower Sentinel");
  assert.equal(boss.alive, true);
  assert.equal(isExitLocked(), true, "exit locked while sentinel lives");

  boss.alive = false;
  assert.equal(getLivingBoss(), null);
  assert.equal(isExitLocked(), false, "exit unlocks when the boss dies");
});

test("isExitLocked is false on a boss-free sector", () => {
  buildLevel(0);
  assert.equal(getLivingBoss(), null);
  assert.equal(isExitLocked(), false);
});
