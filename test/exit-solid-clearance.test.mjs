import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import { aabb } from "../src/physics.js";
import { buildLevel, getLevelCount, solidPlatforms } from "../src/level.js";
import { configureRunMode, level } from "../src/state.js";

/** Player AABB used at jack-in / checkpoint restore. */
const PLAYER_W = 28;
const PLAYER_H = 40;

test("exit volume only overlaps its supporting floor pad, never a blocking solid", () => {
  configureRunMode("normal");
  const n = getLevelCount();

  for (let i = 0; i < n; i++) {
    buildLevel(i);
    const exit = level.exit;
    const feetY = exit.y + exit.h;

    for (const p of solidPlatforms()) {
      if (!aabb(exit, p)) continue;
      const isFloorPad = Math.abs(p.y - feetY) < 0.5;
      assert.ok(
        isFloorPad,
        `sector ${i} (${level.name}): solid at (${p.x},${p.y}) overlaps exit door above the floor`
      );
    }
  }
});

test("spawn jack-in box does not start inside a solid platform", () => {
  configureRunMode("normal");
  const n = getLevelCount();

  for (let i = 0; i < n; i++) {
    buildLevel(i);
    const spawnBox = {
      x: level.spawn.x,
      y: level.spawn.y,
      w: PLAYER_W,
      h: PLAYER_H,
    };

    for (const p of solidPlatforms()) {
      assert.equal(
        aabb(spawnBox, p),
        false,
        `sector ${i} (${level.name}): spawn overlaps solid at (${p.x},${p.y}) ` +
          `(spawn ${level.spawn.x / TILE},${level.spawn.y / TILE})`
      );
    }
  }
});
