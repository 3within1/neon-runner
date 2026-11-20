import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import {
  buildLevel,
  ENEMY_TYPES,
  getLevelCount,
  getLevelDef,
} from "../src/level.js";
import { configureRunMode, enemySpeedMult, level } from "../src/state.js";

/**
 * Aerial X-patrol foes must keep authored tile Y (no snapEnemyToGround) and
 * clamp spawn X into [minX, maxX - w] with +vx at type speed * mode mult.
 */
test("aerial x-patrol enemies keep authored Y and clamp into patrol", () => {
  configureRunMode("normal");
  const n = getLevelCount();
  let aerialCount = 0;

  for (let i = 0; i < n; i++) {
    const def = getLevelDef(i);
    buildLevel(i);

    const used = new Set();
    for (const row of def.enemies) {
      const [, ty, minA, maxA, typeName = "drone"] = row;
      const type = ENEMY_TYPES[typeName];
      if (!type || type.grounded || type.turret || type.axis !== "x") continue;

      const minX = minA * TILE;
      const maxX = maxA * TILE;
      const match = level.enemies.find(
        (e, idx) =>
          !used.has(idx) &&
          e.type === typeName &&
          e.minX === minX &&
          e.maxX === maxX
      );
      assert.ok(
        match,
        `sector ${i} missing aerial ${typeName} patrol [${minA}, ${maxA}]`
      );
      used.add(level.enemies.indexOf(match));
      aerialCount += 1;

      assert.equal(
        match.y,
        ty * TILE,
        `sector ${i} ${typeName} Y must stay at authored tile ${ty} (no ground snap)`
      );
      assert.equal(match.grounded, false);
      assert.equal(match.axis, "x");
      assert.equal(match.vx, type.speed * enemySpeedMult);
      assert.equal(match.vy, 0);
      assert.ok(
        match.x >= match.minX - 1e-9 && match.x <= match.maxX - match.w + 1e-9,
        `sector ${i} ${typeName} spawn X clamped into patrol`
      );
    }
  }

  assert.ok(aerialCount >= 10, `expected many aerial x-patrols, got ${aerialCount}`);
});
