import { test } from "node:test";
import assert from "node:assert/strict";
import { START_LIVES } from "../src/constants.js";
import {
  configureRunMode,
  enemySpeedMult,
  lives,
  runMode,
  scoreMult,
  timeAttackSector,
} from "../src/state.js";

test("configureRunMode stores the time-attack sector while keeping normal lives/mult", () => {
  configureRunMode("lockdown");
  configureRunMode("timeAttack", 4);
  assert.equal(runMode, "timeAttack");
  assert.equal(timeAttackSector, 4);
  assert.equal(scoreMult, 1);
  assert.equal(enemySpeedMult, 1);
  assert.equal(lives, START_LIVES);

  configureRunMode("timeAttack", 0);
  assert.equal(timeAttackSector, 0);

  configureRunMode("timeAttack", -2);
  assert.equal(timeAttackSector, -2, "sector index is stored as given for callers to clamp");
});
