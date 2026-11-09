import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addScore,
  configureRunMode,
  lives,
  nextExtraLifeAt,
  resetRunStats,
  score,
  setScore,
} from "../src/state.js";
import { EXTRA_LIFE_EVERY, START_LIVES } from "../src/constants.js";

test("addScore with NaN delta poisons score once but does not spin the extra-life loop", () => {
  resetRunStats();
  configureRunMode("normal");
  setScore(0);
  const beforeCursor = nextExtraLifeAt;

  const gained = addScore(Number.NaN);
  assert.equal(Number.isNaN(score), true, "NaN reward leaves score non-finite");
  assert.equal(gained, 0, "no lives granted from a NaN delta");
  assert.equal(lives, START_LIVES);
  assert.equal(nextExtraLifeAt, beforeCursor, "extra-life cursor stays put");
});

test("addScore with a finite delta after reset still awards lives normally", () => {
  resetRunStats();
  configureRunMode("normal");
  setScore(0);
  assert.equal(addScore(EXTRA_LIFE_EVERY), 1);
  assert.equal(lives, START_LIVES + 1);
});
