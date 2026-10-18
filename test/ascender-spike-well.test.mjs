import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import { buildLevel } from "../src/level.js";
import { aabb } from "../src/physics.js";
import { level } from "../src/state.js";

/**
 * Cling teach moment: floor spikes used to fill the chimney well *and* the
 * outer drop-in tile, so walking into the gap immediately hurt and cling never
 * armed. Spikes must stay in the well; the ≥1-tile outer drop-in stays clear.
 * Floor Y is derived from split pads so this survives Ascender rebuilds.
 */
test("Ascender outer drop-in tiles stay clear of floor spikes", () => {
  buildLevel(1);
  const shafts = level.platforms.filter((p) => p.h >= 8 * TILE && p.w <= TILE);
  assert.ok(shafts.length >= 2, "expected mirrored cling shafts");

  const floors = level.platforms.filter((p) => p.h >= 2 * TILE && p.w > TILE);
  assert.ok(floors.length >= 2, "expected split floor pads");
  const floorY = Math.max(...floors.map((p) => p.y));

  const teach = shafts.filter((s) => s.y + s.h >= floorY - 2);
  assert.ok(teach.length >= 2, "teach shafts reach the floor");

  const centerish = level.width / 2;
  for (const shaft of teach) {
    const shaftMid = shaft.x + shaft.w / 2;
    const gapX = shaftMid < centerish ? shaft.x - TILE : shaft.x + shaft.w;
    const gap = { x: gapX, y: floorY, w: TILE, h: TILE * 0.5 };
    assert.equal(
      level.hazards.some((h) => aabb(gap, h)),
      false,
      `drop-in beside shaft at x=${shaft.x / TILE} must not be spiked`
    );
  }
});
