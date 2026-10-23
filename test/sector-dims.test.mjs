import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import { buildLevel, getLevelCount, getLevelDef } from "../src/level.js";
import { configureRunMode, level } from "../src/state.js";

/**
 * buildLevel copies def width/height/checkpoints into the live level singleton.
 * A stale size or dropped checkpoint soft-locks camera scroll and mid-sector
 * recovery after a death.
 */
test("built level size and checkpoint roster match the sector def", () => {
  configureRunMode("normal");
  const n = getLevelCount();

  for (let i = 0; i < n; i++) {
    const def = getLevelDef(i);
    buildLevel(i);

    assert.equal(level.width, def.width * TILE, `sector ${i} width`);
    assert.equal(level.height, def.height * TILE, `sector ${i} height`);
    assert.equal(level.sector, def.sector, `sector ${i} sector label`);
    assert.equal(level.name, def.name, `sector ${i} name`);

    const expectedCp = (def.checkpoints || []).length;
    assert.equal(
      level.checkpoints.length,
      expectedCp,
      `sector ${i} checkpoint count`
    );
    assert.ok(expectedCp >= 1, `sector ${i} ships at least one checkpoint`);

    def.checkpoints.forEach(([tx, ty], idx) => {
      const c = level.checkpoints[idx];
      assert.equal(c.x, tx * TILE);
      assert.equal(c.y, ty * TILE);
      assert.equal(c.w, TILE);
      assert.equal(c.h, TILE);
      assert.equal(c.activated, false);
    });
  }
});
