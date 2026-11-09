import { test } from "node:test";
import assert from "node:assert/strict";
import { EXTRA_LIFE_EVERY, START_LIVES } from "../src/constants.js";
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
 * A finished run leaves nextExtraLifeAt well past the first band. The next
 * boot must reset that cursor or the first EXTRA_LIFE_EVERY of DATA never
 * awards a life (or a stale cursor grants one too early after setScore(0)).
 */
test("resetRunStats restores nextExtraLifeAt after a scored run advances it", () => {
  resetRunStats();
  configureRunMode("normal");
  setScore(0);
  setLives(START_LIVES);

  assert.equal(addScore(EXTRA_LIFE_EVERY * 2), 2);
  assert.equal(nextExtraLifeAt, EXTRA_LIFE_EVERY * 3, "cursor walked past the awarded bands");

  const livesAfterAwards = lives;
  assert.equal(livesAfterAwards, START_LIVES + 2);

  resetRunStats();
  assert.equal(nextExtraLifeAt, EXTRA_LIFE_EVERY, "new run starts at the first life threshold");
  assert.equal(lives, livesAfterAwards, "lives are owned by configureRunMode / setLives, not resetRunStats");
});
