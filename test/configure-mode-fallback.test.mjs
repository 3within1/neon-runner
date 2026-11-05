import { test } from "node:test";
import assert from "node:assert/strict";
import { LOCKDOWN_START_LIVES, START_LIVES } from "../src/constants.js";
import {
  configureRunMode,
  enemySpeedMult,
  lives,
  runMode,
  scoreMult,
} from "../src/state.js";

test("configureRunMode clears lockdown multipliers for unknown mode strings", () => {
  configureRunMode("lockdown");
  assert.equal(runMode, "lockdown");
  assert.equal(lives, LOCKDOWN_START_LIVES);
  assert.ok(scoreMult > 1);
  assert.ok(enemySpeedMult > 1);

  configureRunMode("typo");
  assert.equal(runMode, "typo");
  assert.equal(scoreMult, 1, "unknown modes must not keep lockdown score mult");
  assert.equal(enemySpeedMult, 1, "unknown modes must not keep lockdown speed mult");
  assert.equal(lives, START_LIVES);
});
