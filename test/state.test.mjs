import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addScore,
  combo,
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
  setScore,
  tickCombo,
} from "../src/state.js";
import { COMBO_WINDOW, EXTRA_LIFE_EVERY, LOCKDOWN_START_LIVES, START_LIVES } from "../src/constants.js";

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

test("nextComboOnStomp chains while the window is open", () => {
  assert.equal(nextComboOnStomp(0, 0), 1);
  assert.equal(nextComboOnStomp(2, 0.5), 3);
  assert.equal(nextComboOnStomp(4, 0), 1);
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
