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

test("Y-axis climbers spawn with vertical patrol, +vy, and clamped Y", () => {
  configureRunMode("normal");
  const climberDef = ENEMY_TYPES.climber;
  assert.equal(climberDef.axis, "y");
  assert.equal(!!climberDef.grounded, false);

  let climberCount = 0;
  const n = getLevelCount();

  for (let i = 0; i < n; i++) {
    const def = getLevelDef(i);
    const rows = def.enemies.filter((row) => (row[4] || "drone") === "climber");
    if (rows.length === 0) continue;

    buildLevel(i);
    const used = new Set();

    for (const [tx, ty, minA, maxA] of rows) {
      const minY = minA * TILE;
      const maxY = maxA * TILE;
      const match = level.enemies.find(
        (e, idx) =>
          !used.has(idx) &&
          e.type === "climber" &&
          e.minY === minY &&
          e.maxY === maxY
      );
      assert.ok(match, `sector ${i} missing climber patrol Y [${minA}, ${maxA}]`);
      used.add(level.enemies.indexOf(match));
      climberCount += 1;

      assert.equal(match.axis, "y");
      assert.equal(match.grounded, false);
      assert.equal(match.vx, 0);
      assert.equal(match.vy, climberDef.speed * enemySpeedMult);
      assert.equal(match.x, tx * TILE, "climber X stays on authored column");
      assert.ok(
        match.y >= match.minY - 1e-9 &&
          match.y <= match.maxY - match.h + 1e-9,
        `sector ${i} climber Y clamped into [${minA}, ${maxA}] (ty=${ty})`
      );
    }
  }

  assert.ok(climberCount >= 4, `expected several climbers, got ${climberCount}`);
});
