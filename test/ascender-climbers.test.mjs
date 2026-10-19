import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import { buildLevel } from "../src/level.js";
import { level } from "../src/state.js";

test("Ascender climbers patrol the mirrored cling shafts", () => {
  buildLevel(1);
  const shafts = level.platforms.filter((p) => p.h >= 8 * TILE && p.w <= TILE);
  assert.ok(shafts.length >= 2, "expected mirrored cling shafts");

  const climbers = level.enemies.filter((e) => e.type === "climber" && e.alive);
  assert.equal(climbers.length, 2, "one climber per cling shaft");

  for (const shaft of shafts) {
    const shaftMid = shaft.x + shaft.w * 0.5;
    const match = climbers.find((c) => Math.abs(c.x + c.w * 0.5 - shaftMid) < TILE);
    assert.ok(match, `climber missing near shaft at x=${shaft.x / TILE}`);
    assert.equal(match.axis, "y");
    assert.ok(
      match.minY <= shaft.y + TILE,
      "climber patrol reaches the top of the shaft"
    );
    assert.ok(
      match.maxY >= shaft.y + shaft.h - TILE,
      "climber patrol reaches the bottom of the shaft"
    );
  }
});
