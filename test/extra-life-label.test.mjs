import { test } from "node:test";
import assert from "node:assert/strict";
import { EXTRA_LIFE_EVERY, START_LIVES } from "../src/constants.js";
import {
  addScore,
  configureRunMode,
  extraLifeAnnounceLabel,
  lives,
  resetRunStats,
  setScore,
} from "../src/state.js";

test("extraLifeAnnounceLabel is null below one life and pluralizes", () => {
  assert.equal(extraLifeAnnounceLabel(0), null);
  assert.equal(extraLifeAnnounceLabel(-1), null);
  assert.equal(extraLifeAnnounceLabel(1), "EXTRA LIFE");
  assert.equal(extraLifeAnnounceLabel(2), "2 EXTRA LIVES");
  assert.equal(extraLifeAnnounceLabel(3), "3 EXTRA LIVES");
});

test("addScore can grant multiple lives when a single award crosses several thresholds", () => {
  resetRunStats();
  configureRunMode("normal");
  setScore(0);
  const gained = addScore(EXTRA_LIFE_EVERY * 2 + 1);
  assert.equal(gained, 2, "crosses 500 and 1000 in one award");
  assert.equal(lives, START_LIVES + 2);
  assert.equal(extraLifeAnnounceLabel(gained), "2 EXTRA LIVES");
});
