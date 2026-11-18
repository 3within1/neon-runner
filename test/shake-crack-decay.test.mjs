import { test } from "node:test";
import assert from "node:assert/strict";
import {
  crackFlash,
  decayShake,
  setCrackFlash,
  setShake,
  setShakeOffset,
  shake,
  shakeX,
  shakeY,
  tickCrack,
} from "../src/state.js";

// Camera shake and crack flash are the only hit-feedback timers on the pure
// state path. Wrong decay leaves permanent shake or invisible impact flashes.

test("decayShake drains intensity toward zero without going negative", () => {
  setShake(0.4);
  setShakeOffset(3, -2);
  assert.equal(shakeX, 3);
  assert.equal(shakeY, -2);

  decayShake(0.15);
  assert.ok(Math.abs(shake - 0.25) < 1e-9);

  decayShake(1);
  assert.equal(shake, 0, "overshoot clamps to zero");
});

test("tickCrack decays flash; setCrackFlash replaces rather than stacking", () => {
  setCrackFlash(0.2);
  tickCrack(0.05);
  assert.ok(Math.abs(crackFlash - 0.15) < 1e-9);

  setCrackFlash(0.05);
  assert.equal(crackFlash, 0.05, "a weaker flash still overwrites (unlike hitStop max)");

  tickCrack(0.2);
  assert.equal(crackFlash, 0);
});
