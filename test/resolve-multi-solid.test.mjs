import { test } from "node:test";
import assert from "node:assert/strict";
import { rect, resolveAxis } from "../src/physics.js";

/**
 * Stacked / adjacent solids are resolved in list order. Landing into a seam
 * between a floor and a short wall must still zero vy and mark grounded on the
 * floor contact — not leave the runner falling through after the wall push.
 */
test("resolveAxis y-lands on the floor when a wall solid is also overlapping", () => {
  const floor = rect(0, 130, 200, 24);
  const wall = rect(80, 90, 20, 50);
  const entity = { x: 70, y: 100, w: 28, h: 40, vx: 0, vy: 200, onGround: false };
  const prevY = 80;

  resolveAxis(entity, [wall, floor], "y", prevY);

  assert.equal(entity.onGround, true, "floor contact still grounds the runner");
  assert.equal(entity.vy, 0);
  assert.equal(entity.y, 90, "snapped to floor top minus height");
});

test("resolveAxis x stops against the first overlapping wall in list order", () => {
  const near = rect(100, 0, 20, 100);
  const far = rect(140, 0, 20, 100);
  const entity = { x: 90, y: 10, w: 28, h: 40, vx: 120, vy: 0, onGround: false };
  const prevX = 70;

  resolveAxis(entity, [near, far], "x", prevX);

  assert.equal(entity.x, 72, "snaps to the nearer wall");
  assert.equal(entity.vx, 0);
});
