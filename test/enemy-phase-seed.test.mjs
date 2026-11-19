import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLevel, getLevelCount, getLevelDef } from "../src/level.js";
import { configureRunMode, level } from "../src/state.js";

/**
 * spawnEnemy seeds walk/bob from tile coords so neighbors do not animate in
 * lockstep. A constant seed would make whole lanes bob as one hitbox.
 */
test("enemies seed walk and bob phase from spawn tile coords", () => {
  configureRunMode("normal");
  const n = getLevelCount();
  let checked = 0;

  for (let i = 0; i < n; i++) {
    const def = getLevelDef(i);
    buildLevel(i);

    // Turrets may be omitted on normal runs; match built enemies to defs by order
    // of successful spawns (non-turret always spawn; turrets only in lockdown).
    const spawnedDefs = def.enemies.filter((raw) => {
      const typeName = raw[4] || "drone";
      return typeName !== "turret";
    });

    assert.equal(
      level.enemies.length,
      spawnedDefs.length,
      `sector ${i} enemy count matches non-turret defs on normal`
    );

    spawnedDefs.forEach((raw, idx) => {
      const [tx, ty] = raw;
      const e = level.enemies[idx];
      const expectedWalk = (tx * 1.3) % (Math.PI * 2);
      const expectedBob = (tx * 0.7 + ty * 0.3) % (Math.PI * 2);
      assert.ok(
        Math.abs(e.walk - expectedWalk) < 1e-9,
        `sector ${i} enemy[${idx}] walk=${e.walk} expected ${expectedWalk}`
      );
      assert.ok(
        Math.abs(e.bob - expectedBob) < 1e-9,
        `sector ${i} enemy[${idx}] bob=${e.bob} expected ${expectedBob}`
      );
      checked += 1;
    });
  }

  assert.ok(checked >= 20, `expected a full campaign roster, got ${checked}`);

  // Distinct tile seeds must not all collapse to the same phase.
  buildLevel(0);
  const walks = new Set(level.enemies.map((e) => e.walk.toFixed(6)));
  const bobs = new Set(level.enemies.map((e) => e.bob.toFixed(6)));
  assert.ok(walks.size >= 2, "Grid Sprint drones keep staggered walk phases");
  assert.ok(bobs.size >= 2, "Grid Sprint drones keep staggered bob phases");
});
