import { test } from "node:test";
import assert from "node:assert/strict";
import { enemyBody } from "../src/level.js";

test("enemyBody offsets x for vertical climbers by sin(bob)*bobAmp", () => {
  const bob = 0.75;
  const bobAmp = 5;
  const e = { x: 40, y: 80, w: 28, h: 32, grounded: false, bob, bobAmp, axis: "y" };
  const body = enemyBody(e);
  assert.equal(body.y, 80, "vertical bob does not shift y");
  assert.equal(body.w, 28);
  assert.equal(body.h, 32);
  assert.equal(body.x, 40 + Math.sin(bob) * bobAmp, "climber hitbox sways on x");
});

test("enemyBody keeps grounded foes on raw bounds regardless of axis", () => {
  const e = { x: 12, y: 34, w: 36, h: 28, grounded: true, bob: 2, bobAmp: 6, axis: "y" };
  assert.deepEqual(enemyBody(e), { x: 12, y: 34, w: 36, h: 28 });
});
