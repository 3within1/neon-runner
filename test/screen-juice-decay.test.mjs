import { test } from "node:test";
import assert from "node:assert/strict";
import {
  crackFlash,
  decayShake,
  hitStop,
  setCrackFlash,
  setHitStop,
  setShake,
  shake,
  tickCrack,
  tickHitStop,
} from "../src/state.js";

test("setHitStop only ratchets up — weaker pulses do not shorten an active stop", () => {
  setHitStop(0);
  setHitStop(0.12);
  assert.equal(hitStop, 0.12);
  setHitStop(0.05);
  assert.equal(hitStop, 0.12, "max-only stack keeps the longer stop");
  setHitStop(0.2);
  assert.equal(hitStop, 0.2, "a stronger pulse extends the stop");
});

test("tickHitStop and decayShake / tickCrack clamp to zero", () => {
  // setHitStop only ratchets up — drain any leftover from prior cases first.
  tickHitStop(10);
  assert.equal(hitStop, 0);
  setHitStop(0.08);
  tickHitStop(0.03);
  assert.ok(Math.abs(hitStop - 0.05) < 1e-9);
  tickHitStop(1);
  assert.equal(hitStop, 0, "hit-stop never goes negative");

  setShake(0.04);
  decayShake(0.01);
  assert.ok(Math.abs(shake - 0.03) < 1e-9);
  decayShake(1);
  assert.equal(shake, 0, "shake never goes negative");

  setCrackFlash(0.06);
  tickCrack(0.02);
  assert.ok(Math.abs(crackFlash - 0.04) < 1e-9);
  tickCrack(1);
  assert.equal(crackFlash, 0, "crack flash never goes negative");
});
