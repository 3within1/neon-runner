import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resolveBossAirborneGroundY,
  resolveBossAirborneSlideX,
} from "../src/level.js";

const boss = {
  x: 100,
  y: 50,
  w: 112,
  h: 84,
  minX: 0,
  maxX: 500,
  minY: 20,
};

test("slide with floor under forward column moves x toward player", () => {
  const platforms = [{ x: 0, y: 100, w: 600, h: 20, fallen: false }];
  const dx = 200;
  const chaseSpeed = 88;
  const dt = 0.1;
  const nextX = resolveBossAirborneSlideX(boss, dx, chaseSpeed, dt, platforms);
  const expected = boss.x + Math.sign(dx) * chaseSpeed * 0.55 * dt;
  assert.equal(nextX, expected);
  assert.ok(nextX > boss.x);
});

test("slide without floor under forward column holds x", () => {
  const platforms = [{ x: 0, y: 100, w: 120, h: 20, fallen: false }];
  const dx = 200;
  const chaseSpeed = 88;
  const dt = 0.1;
  const nextX = resolveBossAirborneSlideX(boss, dx, chaseSpeed, dt, platforms);
  assert.equal(nextX, boss.x);
});

test("arena clamp when nextX would exceed maxX - w", () => {
  const platforms = [{ x: 0, y: 100, w: 600, h: 20, fallen: false }];
  const nearRight = { ...boss, x: 380 };
  const dx = 200;
  const chaseSpeed = 88;
  const dt = 1;
  const nextX = resolveBossAirborneSlideX(nearRight, dx, chaseSpeed, dt, platforms);
  assert.equal(nextX, nearRight.maxX - nearRight.w);
});

test("ground Y with platform under mid", () => {
  const platforms = [{ x: 0, y: 100, w: 600, h: 20, fallen: false }];
  const groundY = resolveBossAirborneGroundY(platforms, boss);
  assert.equal(groundY, 100);
});

test("ground Y fallback to minY + h when no platform", () => {
  const groundY = resolveBossAirborneGroundY([], boss);
  assert.equal(groundY, boss.minY + boss.h);
});
