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

// Score can only move via addScore in play. A negative delta (refund / bug)
 // must not grant lives or leave nextExtraLifeAt stranded behind score.

test("addScore with a negative delta lowers DATA and never grants lives", () => {
  resetRunStats();
  configureRunMode("normal");
  setLives(START_LIVES);
  setScore(200);
  const cursor = nextExtraLifeAt;
  assert.equal(cursor, EXTRA_LIFE_EVERY);

  assert.equal(addScore(-50), 0);
  assert.equal(score, 150);
  assert.equal(lives, START_LIVES);
  assert.equal(nextExtraLifeAt, cursor, "extra-life cursor does not rewind");
});

test("addScore of zero is a no-op for lives and the extra-life cursor", () => {
  resetRunStats();
  configureRunMode("normal");
  setScore(10);
  const cursor = nextExtraLifeAt;
  assert.equal(addScore(0), 0);
  assert.equal(score, 10);
  assert.equal(nextExtraLifeAt, cursor);
});
