import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveAxis } from "../src/physics.js";

/**
 * resolveAxis does not honor `fallen` — simulation must pass solidPlatforms().
 * If a caller feeds raw level.platforms, a dropped collapse pad becomes an
 * invisible mid-air ledge (or wall). Lock the physics-layer contract so a
 * future "cleanup" cannot silently drop the filter at the call site only.
 */
test("resolveAxis still lands on a fallen pad (caller must filter solids)", () => {
  const fallen = { x: 0, y: 100, w: 120, h: 20, fallen: true };
  const entity = { x: 10, y: 70, w: 28, h: 40, vx: 0, vy: 200, onGround: false };
  const prevY = 60; // previous bottom (100) was above the pad top
  resolveAxis(entity, [fallen], "y", prevY);
  assert.equal(entity.y, 60, "snaps to fallen pad top minus height");
  assert.equal(entity.vy, 0);
  assert.equal(entity.onGround, true);
});

test("resolveAxis still blocks sideways into a fallen wall pad", () => {
  const fallen = { x: 100, y: 0, w: 20, h: 100, fallen: true };
  const entity = { x: 90, y: 10, w: 28, h: 40, vx: 80, vy: 0, onGround: false };
  const prevX = 70; // previous right edge left of the wall
  resolveAxis(entity, [fallen], "x", prevX);
  assert.equal(entity.x, 72, "snaps to fallen wall left minus width");
  assert.equal(entity.vx, 0);
});
