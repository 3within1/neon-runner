import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLevel, getLevelCount } from "../src/level.js";
import { level } from "../src/state.js";

/**
 * Spawn and exit must sit inside the built world AABB. An out-of-bounds jack-in
 * or exit soft-locks the sector (pit death loop / unreachable clear).
 */
test("every sector keeps spawn and exit inside the built world bounds", () => {
  const n = getLevelCount();
  for (let i = 0; i < n; i++) {
    buildLevel(i);
    const { width, height, spawn, exit } = level;
    assert.ok(width > 0 && height > 0, `sector ${i} has positive size`);

    assert.ok(spawn.x >= 0 && spawn.x < width, `sector ${i} spawn.x in bounds`);
    assert.ok(spawn.y >= 0 && spawn.y < height, `sector ${i} spawn.y in bounds`);

    assert.ok(exit.x >= 0, `sector ${i} exit.x >= 0`);
    assert.ok(exit.y >= 0, `sector ${i} exit.y >= 0`);
    assert.ok(exit.x + exit.w <= width + 1e-6, `sector ${i} exit right edge in bounds`);
    assert.ok(exit.y + exit.h <= height + 1e-6, `sector ${i} exit bottom edge in bounds`);
  }
});
