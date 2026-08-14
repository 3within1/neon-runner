import { test } from "node:test";
import assert from "node:assert/strict";
import {
  abilitiesForSector,
  addScore,
  combo,
  comboBonusForStomp,
  comboTimer,
  configureRunMode,
  enemySpeedMult,
  lives,
  maxCombo,
  nextComboOnStomp,
  resetRunStats,
  scoreMult,
  setCombo,
  setComboTimer,
  setLives,
  setScore,
  tickCombo,
} from "../src/state.js";
import {
  COMBO_BONUS_DATA,
  COMBO_BONUS_EVERY,
  COMBO_WINDOW,
  EXTRA_LIFE_EVERY,
  LOCKDOWN_START_LIVES,
  MAX_LIVES,
  START_LIVES,
  UNLOCK_DASH_SECTOR,
  UNLOCK_DOUBLE_JUMP_SECTOR,
  UNLOCK_WALL_CLING_SECTOR,
} from "../src/constants.js";

// state.js is a module-level singleton; these tests import the live bindings
// (which reflect the latest values) and reset between assertions.

test("combo decays over its window and resets when it expires", () => {
  resetRunStats();
  setCombo(1);
  setComboTimer(COMBO_WINDOW);

  tickCombo(COMBO_WINDOW / 2);
  assert.ok(comboTimer > 0, "timer still running mid-window");
  assert.equal(combo, 1, "combo retained while the window is open");

  tickCombo(COMBO_WINDOW); // overshoot to force expiry
  assert.equal(comboTimer, 0, "timer clamps to zero");
  assert.equal(combo, 0, "combo resets once the window closes");
});

test("maxCombo tracks the highest combo reached", () => {
  resetRunStats();
  setCombo(1);
  setCombo(4);
  setCombo(2);
  assert.equal(maxCombo, 4, "keeps the peak, not the latest");
});

test("addScore grants an extra life per threshold crossed", () => {
  resetRunStats();
  configureRunMode("normal"); // lives = START_LIVES, scoreMult = 1
  setScore(0);

  assert.equal(addScore(EXTRA_LIFE_EVERY - 1), 0, "no life below the threshold");
  const gained = addScore(1); // crosses EXTRA_LIFE_EVERY exactly
  assert.equal(gained, 1, "one life at the threshold");
  assert.equal(lives, START_LIVES + 1, "life total incremented");
});

test("configureRunMode applies lockdown multipliers and starting lives", () => {
  configureRunMode("lockdown");
  assert.equal(lives, LOCKDOWN_START_LIVES, "lockdown starting lives");
  assert.ok(scoreMult > 1, "lockdown boosts score multiplier");
  assert.ok(enemySpeedMult > 1, "lockdown boosts enemy speed");

  configureRunMode("normal");
  assert.equal(scoreMult, 1, "normal resets score multiplier");
  assert.equal(enemySpeedMult, 1, "normal resets enemy speed");
  assert.equal(lives, START_LIVES, "normal starting lives");
});

test("nextComboOnStomp chains while the window is open", () => {
  assert.equal(nextComboOnStomp(0, 0), 1, "first stomp starts a chain");
  assert.equal(nextComboOnStomp(2, 0.5), 3, "active window extends the combo");
  assert.equal(nextComboOnStomp(4, 0), 1, "expired window resets to 1");
});

test("comboBonusForStomp awards DATA on every Nth chained stomp", () => {
  assert.equal(comboBonusForStomp(1), 0, "opening stomp has no bonus");
  assert.equal(comboBonusForStomp(COMBO_BONUS_EVERY - 1), 0, "pre-milestone stomp");
  assert.equal(comboBonusForStomp(COMBO_BONUS_EVERY), COMBO_BONUS_DATA, "milestone awards bonus");
  assert.equal(comboBonusForStomp(COMBO_BONUS_EVERY * 2), COMBO_BONUS_DATA, "later milestones also award");
  assert.equal(comboBonusForStomp(0), 0, "non-positive combo awards nothing");
});

test("abilitiesForSector gates wall cling, air-jump, and dash by campaign index", () => {
  assert.deepEqual(abilitiesForSector(UNLOCK_WALL_CLING_SECTOR - 1), {
    maxAirJumps: 0,
    canDash: false,
    canWallCling: false,
  });
  assert.deepEqual(abilitiesForSector(UNLOCK_WALL_CLING_SECTOR), {
    maxAirJumps: 0,
    canDash: false,
    canWallCling: true,
  });
  assert.deepEqual(abilitiesForSector(UNLOCK_DOUBLE_JUMP_SECTOR), {
    maxAirJumps: 1,
    canDash: false,
    canWallCling: true,
  });
  assert.deepEqual(abilitiesForSector(UNLOCK_DASH_SECTOR - 1), {
    maxAirJumps: 1,
    canDash: false,
    canWallCling: true,
  });
  assert.deepEqual(abilitiesForSector(UNLOCK_DASH_SECTOR), {
    maxAirJumps: 1,
    canDash: true,
    canWallCling: true,
  });
});

test("addScore stops granting lives at the soft cap", () => {
  resetRunStats();
  configureRunMode("normal");
  setLives(MAX_LIVES);
  setScore(EXTRA_LIFE_EVERY - 1);
  assert.equal(addScore(1), 0, "no life granted at the soft cap");
  assert.equal(lives, MAX_LIVES, "lives remain at soft cap");
});
