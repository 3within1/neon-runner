import { test } from "node:test";
import assert from "node:assert/strict";
import { bossPhaseFromHp, minibossPhaseFromHp } from "../src/level.js";

test("bossPhaseFromHp is enraged at and below zero remaining HP", () => {
  assert.equal(bossPhaseFromHp(0, 10), 3);
  assert.equal(bossPhaseFromHp(0.01, 10), 3);
  assert.equal(bossPhaseFromHp(-1, 10), 3, "overkill still reads as phase 3");
});

test("minibossPhaseFromHp treats non-positive HP as the final phase", () => {
  assert.equal(minibossPhaseFromHp(0), 3);
  assert.equal(minibossPhaseFromHp(-2), 3);
});
