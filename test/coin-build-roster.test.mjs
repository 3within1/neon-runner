import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import { buildLevel, getLevelCount, getLevelDef } from "../src/level.js";
import { configureRunMode, level } from "../src/state.js";

/**
 * Coin pickup scoring depends on build placing every def coin with a fresh
 * taken=false and the +14 tile inset. Missing coins or sticky taken flags
 * soft-break pack tallies and extra-life pacing.
 */
test("built coins match level defs and start collectible", () => {
  configureRunMode("normal");
  const n = getLevelCount();
  let total = 0;

  for (let i = 0; i < n; i++) {
    const def = getLevelDef(i);
    buildLevel(i);
    assert.equal(
      level.coins.length,
      def.coins.length,
      `sector ${i} (${level.name}) coin count matches def`
    );
    def.coins.forEach(([tx, ty], idx) => {
      const coin = level.coins[idx];
      assert.equal(coin.x, tx * TILE + 14, `sector ${i} coin[${idx}] x inset`);
      assert.equal(coin.y, ty * TILE + 14, `sector ${i} coin[${idx}] y inset`);
      assert.equal(coin.r, 10);
      assert.equal(coin.taken, false);
      assert.ok(Number.isFinite(coin.phase), `sector ${i} coin[${idx}] has a bob phase`);
    });
    total += level.coins.length;
  }

  assert.ok(total >= 40, `campaign still ships a meaningful coin roster, got ${total}`);
});
