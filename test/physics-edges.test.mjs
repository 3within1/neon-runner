import { test } from "node:test";
import assert from "node:assert/strict";
import { aabb, rect, resolveAxis, segmentHitsRect } from "../src/physics.js";

test("resolveAxis bumps a rising entity off a ceiling", () => {
  const ceiling = rect(0, 0, 100, 20);
  const entity = { x: 10, y: 10, w: 28, h: 40, vx: 0, vy: -200, onGround: false };
  const prevY = 40; // previous top was below the ceiling bottom (20)
  resolveAxis(entity, [ceiling], "y", prevY);
  assert.equal(entity.y, 20, "snaps to ceiling bottom");
  assert.equal(entity.vy, 0, "upward velocity cancelled");
  assert.equal(entity.onGround, false, "ceiling contact is not ground");
});

test("resolveAxis exits left when already overlapping without clear prev side", () => {
  const wall = rect(50, 0, 20, 100);
  const entity = { x: 40, y: 10, w: 28, h: 40, vx: 50, vy: 0, onGround: false };
  // prev also overlaps — falls through the ambiguous branch
  resolveAxis(entity, [wall], "x", 40);
  assert.equal(entity.vx, 0);
  assert.ok(entity.x === 22 || entity.x === 70, "pushed fully out of the wall");
});

test("segmentHitsRect returns false for a zero-length miss beside the target", () => {
  const target = rect(100, 0, 10, 10);
  assert.equal(segmentHitsRect(0, 0, 0, 0, 8, 8, target), false);
  assert.equal(aabb(rect(0, 0, 8, 8), target), false);
});
