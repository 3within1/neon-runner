import { test } from "node:test";
import assert from "node:assert/strict";
import { isSafeStandingAt } from "../src/level.js";

const feet = { x: 100, y: 200, w: 28, h: 40 };

test("empty hazards and enemies with onGround is safe", () => {
  assert.equal(isSafeStandingAt(feet, true, [], [], []), true);
});

test("spike overlap is unsafe", () => {
  const spike = { x: 105, y: 210, w: 20, h: 10, kind: "spike" };
  assert.equal(isSafeStandingAt(feet, true, [spike], [], []), false);
});

test("laser off is safe; laser on overlap is unsafe", () => {
  const laserOff = { x: 105, y: 210, w: 40, h: 8, kind: "laser", on: false };
  assert.equal(isSafeStandingAt(feet, true, [laserOff], [], []), true);
  const laserOn = { ...laserOff, on: true };
  assert.equal(isSafeStandingAt(feet, true, [laserOn], [], []), false);
});

test("living enemy overlap is unsafe; dead enemy is safe", () => {
  const turret = {
    x: 105,
    y: 200,
    w: 36,
    h: 36,
    grounded: true,
    alive: true,
    bobAmp: 0,
    bob: 0,
    axis: "x",
  };
  assert.equal(isSafeStandingAt(feet, true, [], [turret], []), false);
  assert.equal(isSafeStandingAt(feet, true, [], [{ ...turret, alive: false }], []), true);
});

test("collapse underfoot onGround is unsafe; airborne is safe; fallen collapse is safe", () => {
  const collapse = {
    x: 90,
    y: feet.y + feet.h,
    w: 60,
    h: 12,
    kind: "collapse",
    fallen: false,
  };
  assert.equal(isSafeStandingAt(feet, true, [], [], [collapse]), false);
  assert.equal(isSafeStandingAt(feet, false, [], [], [collapse]), true);
  assert.equal(
    isSafeStandingAt(feet, true, [], [], [{ ...collapse, fallen: true }]),
    true
  );
});
