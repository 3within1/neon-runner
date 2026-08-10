import { test } from "node:test";
import assert from "node:assert/strict";
import { aabb, mod, rect, resolveAxis, segmentHitsRect } from "../src/physics.js";

test("aabb detects overlap and treats edge-touch as non-overlapping", () => {
  const a = rect(0, 0, 10, 10);
  assert.equal(aabb(a, rect(5, 5, 10, 10)), true, "overlapping boxes");
  assert.equal(aabb(a, rect(20, 0, 10, 10)), false, "disjoint boxes");
  assert.equal(aabb(a, rect(10, 0, 10, 10)), false, "flush edges do not count as overlap");
});

test("mod wraps negatives into [0, m)", () => {
  assert.equal(mod(7, 5), 2);
  assert.equal(mod(-1, 5), 4);
  assert.equal(mod(-5, 5), 0);
});

test("segmentHitsRect samples the swept path", () => {
  const target = rect(45, -5, 10, 20);
  assert.equal(segmentHitsRect(0, 0, 100, 0, 10, 10, target), true, "path crosses the rect");
  const away = rect(200, 200, 5, 5);
  assert.equal(segmentHitsRect(0, 0, 100, 0, 10, 10, away), false, "path misses the rect");
});

test("resolveAxis lands a falling entity on top of a platform", () => {
  const platform = rect(0, 130, 100, 20);
  const entity = { x: 10, y: 100, w: 28, h: 40, vx: 0, vy: 200, onGround: false };
  const prevY = 80; // previous bottom (120) was above the platform top (130)
  resolveAxis(entity, [platform], "y", prevY);
  assert.equal(entity.y, 90, "snaps to platform top minus height");
  assert.equal(entity.vy, 0, "vertical velocity zeroed");
  assert.equal(entity.onGround, true, "marked grounded");
});

test("resolveAxis stops horizontal motion into a wall", () => {
  const wall = rect(100, -10, 20, 100);
  const entity = { x: 90, y: 0, w: 28, h: 40, vx: 100, vy: 0, onGround: false };
  const prevX = 70; // previous right edge (98) was left of the wall (100)
  resolveAxis(entity, [wall], "x", prevX);
  assert.equal(entity.x, 72, "snaps to wall left minus width");
  assert.equal(entity.vx, 0, "horizontal velocity zeroed");
});
