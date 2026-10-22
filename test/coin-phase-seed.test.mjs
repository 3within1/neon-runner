import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import { buildLevel, getLevelCount, getLevelDef } from "../src/level.js";
import { configureRunMode, level } from "../src/state.js";

test("coins seed bob phase from roster index and stay untaken at build", () => {
  configureRunMode("normal");
  const n = getLevelCount();
  let coinCount = 0;

  for (let i = 0; i < n; i++) {
    const def = getLevelDef(i);
    buildLevel(i);

    assert.equal(level.coins.length, def.coins.length, `sector ${i} coin count`);

    def.coins.forEach(([tx, ty], idx) => {
      const c = level.coins[idx];
      coinCount += 1;
      assert.equal(c.x, tx * TILE + 14);
      assert.equal(c.y, ty * TILE + 14);
      assert.equal(c.r, 10);
      assert.equal(c.taken, false);
      assert.equal(c.phase, (idx * 0.7) % (Math.PI * 2));
    });
  }

  assert.ok(coinCount >= 20, `expected many coins, got ${coinCount}`);
});
