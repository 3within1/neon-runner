import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import { buildLevel, getLevelCount } from "../src/level.js";
import { configureRunMode, level } from "../src/state.js";

/**
 * Layout typos in LEVELS (negative tiles, off-by-one width) soft-lock or
 * drop entities into the void. Keep every built entity inside the sector AABB.
 */
test("built spawn, exit, pads, hazards, checkpoints, and coins stay in-bounds", () => {
  configureRunMode("normal");
  const n = getLevelCount();
  for (let i = 0; i < n; i++) {
    buildLevel(i);
    const { width: W, height: H, name } = level;
    const tag = `sector ${i} (${name})`;

    assert.ok(level.spawn.x >= 0 && level.spawn.x < W, `${tag}: spawn.x in-bounds`);
    assert.ok(level.spawn.y >= 0 && level.spawn.y < H, `${tag}: spawn.y in-bounds`);

    assert.ok(level.exit.x >= 0 && level.exit.x + level.exit.w <= W + TILE, `${tag}: exit.x`);
    assert.ok(level.exit.y >= 0 && level.exit.y < H, `${tag}: exit.y`);

    for (const p of level.platforms) {
      assert.ok(p.x >= -TILE && p.x + p.w <= W + TILE, `${tag}: platform x span`);
      assert.ok(p.y >= 0 && p.y < H + TILE, `${tag}: platform y`);
      assert.ok(p.w > 0 && p.h > 0, `${tag}: platform has positive size`);
    }

    for (const h of level.hazards) {
      assert.ok(h.x >= -TILE && h.x + h.w <= W + TILE, `${tag}: hazard x`);
      assert.ok(h.y >= 0 && h.y < H + TILE, `${tag}: hazard y`);
      assert.ok(["spike", "electric", "laser"].includes(h.kind), `${tag}: known hazard kind`);
      assert.ok(Number.isFinite(h.period) && h.period > 0, `${tag}: positive hazard period`);
    }

    for (const c of level.checkpoints) {
      assert.ok(c.x >= 0 && c.x + c.w <= W, `${tag}: checkpoint x`);
      assert.ok(c.y >= 0 && c.y < H, `${tag}: checkpoint y`);
      assert.equal(c.activated, false, `${tag}: checkpoints start inactive`);
    }

    for (const coin of level.coins) {
      assert.ok(coin.x >= 0 && coin.x <= W, `${tag}: coin x`);
      assert.ok(coin.y >= 0 && coin.y <= H, `${tag}: coin y`);
      assert.equal(coin.taken, false, `${tag}: coins start untaken`);
    }

    assert.ok(level.checkpoints.length >= 1, `${tag}: at least one checkpoint`);
  }
});
