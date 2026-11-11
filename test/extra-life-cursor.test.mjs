import { test } from "node:test";
import assert from "node:assert/strict";
import { EXTRA_LIFE_EVERY, MAX_LIVES } from "../src/constants.js";
import {
  addScore,
  configureRunMode,
  lives,
  nextExtraLifeAt,
  resetRunStats,
  setLives,
  setScore,
} from "../src/state.js";

/**
 * Soft-cap must still advance the next-life cursor. If the cursor stalls while
 * lives are maxed, a later death + score drip can dump a backlog of banked
 * lives in one frame.
 */
test("addScore advances nextExtraLifeAt at the soft lives cap", () => {
  resetRunStats();
  configureRunMode("normal");
  setLives(MAX_LIVES);
  setScore(EXTRA_LIFE_EVERY - 1);
  assert.equal(nextExtraLifeAt, EXTRA_LIFE_EVERY);

  assert.equal(addScore(1), 0, "no life granted while soft-capped");
  assert.equal(lives, MAX_LIVES);
  assert.equal(
    nextExtraLifeAt,
    EXTRA_LIFE_EVERY * 2,
    "threshold cursor must still walk forward"
  );
});

test("addScore walks the cursor across multiple capped bands", () => {
  resetRunStats();
  configureRunMode("normal");
  setLives(MAX_LIVES);
  setScore(0);

  assert.equal(addScore(EXTRA_LIFE_EVERY * 3), 0);
  assert.equal(lives, MAX_LIVES);
  assert.equal(nextExtraLifeAt, EXTRA_LIFE_EVERY * 4);
});
