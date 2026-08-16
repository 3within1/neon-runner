import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import { buildLevel, solidPlatforms } from "../src/level.js";
import { aabb } from "../src/physics.js";
import { level } from "../src/state.js";

/**
 * Regression for the Ascender cling teach moment: floor pads used to sit flush
 * against the shafts, so the runner stayed grounded while pressing into the
 * wall and cling never armed. Pads must leave a ≥1-tile air gap.
 */
test("Ascender floor pads leave a one-tile drop-in beside cling shafts", () => {
  buildLevel(1);
  const shafts = level.platforms.filter((p) => p.h >= 8 * TILE && p.w <= TILE);
  assert.ok(shafts.length >= 2, "expected mirrored cling shafts");

  const solids = solidPlatforms();
  const floors = level.platforms.filter((p) => p.h >= 2 * TILE && p.w > TILE);
  assert.ok(floors.length >= 2, "expected split floor pads");
  const floorY = Math.max(...floors.map((p) => p.y));

  const teach = shafts.filter((s) => s.y + s.h >= floorY - 2);
  assert.ok(teach.length >= 2, "teach shafts reach the floor");

  const centerish = level.width / 2;
  for (const shaft of teach) {
    const shaftMid = shaft.x + shaft.w / 2;
    // Drop-in sits on the outer side (between the shortened floor pad and the shaft).
    const gapX = shaftMid < centerish ? shaft.x - TILE : shaft.x + shaft.w;
    const gap = { x: gapX, y: floorY, w: TILE, h: TILE * 0.5 };
    const blocked = solids.some((p) => aabb(gap, p));
    assert.equal(
      blocked,
      false,
      `drop-in beside shaft at x=${shaft.x / TILE} must be open air`
    );
  }
});
