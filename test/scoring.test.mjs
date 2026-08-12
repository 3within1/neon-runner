import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EXTRA_LIFE_EVERY,
  LOCKDOWN_SCORE_MULT,
  LOCKDOWN_START_LIVES,
  START_LIVES,
} from "../src/constants.js";
import {
  addScore,
  addRunCoin,
  addRunDeath,
  addRunStomp,
  configureRunMode,
  lives,
  practiceMode,
  resetRunStats,
  runCoins,
  runDeaths,
  runStomps,
  score,
  setPracticeMode,
  setScore,
  startingLivesForMode,
} from "../src/state.js";

test("addScore applies lockdown score multiplier before awarding DATA", () => {
  resetRunStats();
  configureRunMode("lockdown");
  setScore(0);
  const gained = addScore(100);
  assert.equal(score, Math.round(100 * LOCKDOWN_SCORE_MULT));
  assert.equal(gained, 0, "100*mult stays below the first extra-life threshold");
});

test("addScore under lockdown can cross an extra-life threshold via the multiplier", () => {
  resetRunStats();
  configureRunMode("lockdown");
  setScore(0);
  // Need applied = EXTRA_LIFE_EVERY: delta * 1.5 ≈ 500 → delta = ceil(500/1.5)
  const delta = Math.ceil(EXTRA_LIFE_EVERY / LOCKDOWN_SCORE_MULT);
  const gained = addScore(delta);
  assert.ok(score >= EXTRA_LIFE_EVERY, "multiplied score reaches the threshold");
  assert.equal(gained, 1);
  assert.equal(lives, LOCKDOWN_START_LIVES + 1);
});

test("startingLivesForMode mirrors configureRunMode starting lives", () => {
  configureRunMode("lockdown");
  assert.equal(startingLivesForMode(), LOCKDOWN_START_LIVES);
  configureRunMode("normal");
  assert.equal(startingLivesForMode(), START_LIVES);
  configureRunMode("timeAttack", 2);
  assert.equal(startingLivesForMode(), START_LIVES, "time attack uses normal lives");
});

test("setPracticeMode toggles the practice flag used to skip unlocks", () => {
  setPracticeMode(true);
  assert.equal(practiceMode, true);
  setPracticeMode(false);
  assert.equal(practiceMode, false);
});

test("run tallies accumulate coins, stomps, and deaths independently", () => {
  resetRunStats();
  addRunCoin(3);
  addRunStomp();
  addRunStomp(2);
  addRunDeath();
  assert.equal(runCoins, 3);
  assert.equal(runStomps, 3);
  assert.equal(runDeaths, 1);
  resetRunStats();
  assert.equal(runCoins, 0);
  assert.equal(runStomps, 0);
  assert.equal(runDeaths, 0);
});
