import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveAxis } from "../src/physics.js";

/**
 * Early frames / cleared collapse rooms can hand resolveAxis an empty solid
 * list. It must be a pure no-op (no throw, no velocity wipe).
 */
test("resolveAxis is a no-op with an empty platform list", () => {
  const entity = { x: 40, y: 80, w: 28, h: 40, vx: 120, vy: -50, onGround: false };
  resolveAxis(entity, [], "x", 20);
  resolveAxis(entity, [], "y", 60);
  assert.equal(entity.x, 40);
  assert.equal(entity.y, 80);
  assert.equal(entity.vx, 120);
  assert.equal(entity.vy, -50);
  assert.equal(entity.onGround, false);
});
