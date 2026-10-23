import { test } from "node:test";
import assert from "node:assert/strict";
import {
  configureRunMode,
  runMode,
  timeAttackSector,
} from "../src/state.js";

/**
 * Time Trial boots a single sector via configureRunMode(mode, sector).
 * Dropping the sector arg (or failing to store it) always restarts Grid Sprint.
 */
test("configureRunMode stores timeAttackSector for time-trial boots", () => {
  configureRunMode("timeAttack", 4);
  assert.equal(runMode, "timeAttack");
  assert.equal(timeAttackSector, 4);

  configureRunMode("timeAttack", 0);
  assert.equal(timeAttackSector, 0);

  configureRunMode("normal");
  assert.equal(runMode, "normal");
  assert.equal(timeAttackSector, 0, "omitted sector defaults to 0");

  configureRunMode("lockdown", 2);
  assert.equal(runMode, "lockdown");
  assert.equal(
    timeAttackSector,
    2,
    "sector arg is still recorded even outside timeAttack"
  );
});
