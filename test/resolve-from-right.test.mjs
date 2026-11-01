import { test } from "node:test";
import assert from "node:assert/strict";
import { rect, resolveAxis } from "../src/physics.js";

// Mirror of the left-wall case in physics.test: approaching a solid from the
 // right must snap to the wall's right face and zero vx (no tunneling).

test("resolveAxis stops horizontal motion into a wall from the right", () => {
  const wall = rect(100, -10, 20, 100);
  const entity = { x: 112, y: 0, w: 28, h: 40, vx: -100, vy: 0, onGround: false };
  const prevX = 130; // previous left edge (130) was right of the wall right (120)
  resolveAxis(entity, [wall], "x", prevX);
  assert.equal(entity.x, 120, "snaps to wall right face");
  assert.equal(entity.vx, 0, "horizontal velocity zeroed");
});

test("resolveAxis lands an entity that falls onto a pad from above across multiple platforms", () => {
  const low = rect(0, 200, 100, 20);
  const high = rect(0, 100, 100, 20);
  const entity = { x: 10, y: 70, w: 28, h: 40, vx: 0, vy: 300, onGround: false };
  // prev bottom 100 was above the high pad top (100) — actually prevY=60 → bottom 100
  resolveAxis(entity, [high, low], "y", 60);
  assert.equal(entity.y, 60, "snaps to the higher pad first encountered via AABB");
  assert.equal(entity.onGround, true);
  assert.equal(entity.vy, 0);
});
