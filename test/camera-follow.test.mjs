import { test } from "node:test";
import assert from "node:assert/strict";
import { cameraTargetFromPlayer, stepCameraPosition } from "../src/physics.js";
import { LOGICAL_W, LOGICAL_H } from "../src/constants.js";

test("cameraTargetFromPlayer offsets player center to ~38% / 55% of viewport", () => {
  const box = { x: 400, y: 200, w: 28, h: 40 };
  const target = cameraTargetFromPlayer(box, LOGICAL_W, LOGICAL_H);
  assert.equal(target.x, box.x + box.w / 2 - LOGICAL_W * 0.38);
  assert.equal(target.y, box.y + box.h / 2 - LOGICAL_H * 0.55);
});

test("stepCameraPosition moves partially toward target", () => {
  const cam = { x: 0, y: 0 };
  const target = { x: 100, y: 100 };
  const dt = 0.1;
  const next = stepCameraPosition(cam, target, dt, 5000, 3000, LOGICAL_W, LOGICAL_H);
  assert.ok(Math.abs(next.x - 60) < 1e-9, "X eases with factor dt * 6");
  assert.ok(Math.abs(next.y - 40) < 1e-9, "Y eases with factor dt * 4");
});

test("stepCameraPosition saturates smoothing at large dt", () => {
  const cam = { x: 0, y: 0 };
  const target = { x: 200, y: 200 };
  const next = stepCameraPosition(cam, target, 1, 5000, 3000, LOGICAL_W, LOGICAL_H);
  assert.equal(next.x, 200);
  assert.equal(next.y, 200);
});

test("stepCameraPosition clamps X and Y to level bounds", () => {
  const levelW = LOGICAL_W + 200;
  const levelH = LOGICAL_H + 400;
  const cam = { x: 0, y: 0 };
  const target = { x: 500, y: 800 };
  const next = stepCameraPosition(cam, target, 1, levelW, levelH, LOGICAL_W, LOGICAL_H);
  assert.equal(next.x, levelW - LOGICAL_W, "X clamped to right edge");
  assert.equal(next.y, levelH - LOGICAL_H, "Y clamped to bottom in tall level");
});

test("stepCameraPosition is idempotent at bounds", () => {
  const levelW = LOGICAL_W;
  const levelH = LOGICAL_H;
  const cam = { x: 0, y: 0 };
  const target = { x: -100, y: -100 };
  const first = stepCameraPosition(cam, target, 1, levelW, levelH, LOGICAL_W, LOGICAL_H);
  const second = stepCameraPosition(first, target, 1, levelW, levelH, LOGICAL_W, LOGICAL_H);
  assert.deepEqual(first, { x: 0, y: 0 });
  assert.deepEqual(second, { x: 0, y: 0 });
});
