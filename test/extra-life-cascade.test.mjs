import { test } from "node:test";
import assert from "node:assert/strict";
import { EXTRA_LIFE_EVERY, START_LIVES } from "../src/constants.js";
import {
  addScore,
  configureRunMode,
  lives,
  nextExtraLifeAt,
  resetRunStats,
  score,
  setLives,
  setScore,
} from "../src/state.js";

/**
 * A large DATA award (boss clear, lockdown mult) can cross several extra-life
 * thresholds in one addScore call. The while-loop must grant every life, not
 * stop after the first.
 */
test("addScore grants one life per EXTRA_LIFE_EVERY threshold crossed", () => {
  resetRunStats();
  configureRunMode("normal");
  setScore(0);
  setLives(START_LIVES);
  // resetRunStats / configureRunMode leave nextExtraLifeAt at EXTRA_LIFE_EVERY
  assert.equal(nextExtraLifeAt, EXTRA_LIFE_EVERY);

  const gained = addScore(EXTRA_LIFE_EVERY * 3);
  assert.equal(gained, 3, "three thresholds → three lives");
  assert.equal(lives, START_LIVES + 3);
  assert.equal(score, EXTRA_LIFE_EVERY * 3);
  assert.equal(nextExtraLifeAt, EXTRA_LIFE_EVERY * 4);
});

test("addScore cascade still respects the soft lives cap mid-loop", () => {
  resetRunStats();
  configureRunMode("normal");
  setScore(0);
  // Leave room for only one more life before MAX_LIVES (9).
  setLives(8);
  const gained = addScore(EXTRA_LIFE_EVERY * 5);
  assert.equal(gained, 1, "only the soft-cap remaining slot is filled");
  assert.equal(lives, 9);
  // Threshold cursor still advances for every crossed band.
  assert.equal(nextExtraLifeAt, EXTRA_LIFE_EVERY * 6);
});
