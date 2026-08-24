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

test("decayShake counts down and clamps at zero", () => {
  setShake(0.35);
  decayShake(0.1);
  assert.ok(Math.abs(shake - 0.25) < 1e-9);
  decayShake(1);
  assert.equal(shake, 0);
});

test("tickHitStop counts down and clamps at zero", () => {
  setHitStop(0.14);
  tickHitStop(0.04);
  assert.ok(Math.abs(hitStop - 0.1) < 1e-9);
  tickHitStop(1);
  assert.equal(hitStop, 0);
});

test("tickCrack counts down and clamps at zero", () => {
  setCrackFlash(0.85);
  tickCrack(0.25);
  assert.ok(Math.abs(crackFlash - 0.6) < 1e-9);
  tickCrack(1);
  assert.equal(crackFlash, 0);
});
