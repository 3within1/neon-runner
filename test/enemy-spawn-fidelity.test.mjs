import { test } from "node:test";
import assert from "node:assert/strict";
import { LOCKDOWN_SPEED_MULT } from "../src/constants.js";
import { buildLevel, ENEMY_TYPES, getLevelCount } from "../src/level.js";
import { configureRunMode, level } from "../src/state.js";

/**
 * spawnEnemy must copy ENEMY_TYPES into live entities. Drift here silently
 * breaks stomp HP, boss gates, scoring, and lockdown speed scaling.
 */
test("built enemies inherit ENEMY_TYPES stats (normal + lockdown speed)", () => {
  const n = getLevelCount();
  let seen = 0;

  for (const mode of ["normal", "lockdown"]) {
    configureRunMode(mode);
    const speedMult = mode === "lockdown" ? LOCKDOWN_SPEED_MULT : 1;

    for (let i = 0; i < n; i++) {
      buildLevel(i);
      for (const e of level.enemies) {
        const def = ENEMY_TYPES[e.type];
        assert.ok(def, `sector ${i} unknown type ${e.type}`);
        assert.equal(e.w, def.w, `${e.type} width`);
        assert.equal(e.h, def.h, `${e.type} height`);
        assert.equal(e.hp, def.hp, `${e.type} hp`);
        assert.equal(e.maxHp, def.hp, `${e.type} maxHp matches spawn hp`);
        assert.equal(e.score, def.score, `${e.type} score`);
        assert.equal(e.axis, def.axis, `${e.type} axis`);
        assert.equal(e.grounded, !!def.grounded, `${e.type} grounded flag`);
        assert.equal(e.boss, !!def.boss, `${e.type} boss flag`);
        assert.equal(e.miniboss, !!def.miniboss, `${e.type} miniboss flag`);
        assert.equal(e.chase, !!def.chase, `${e.type} chase flag`);
        assert.equal(e.turret, !!def.turret, `${e.type} turret flag`);
        assert.equal(e.alive, true);
        assert.ok(
          Math.abs(e.baseSpeed - def.speed * speedMult) < 1e-9,
          `${mode} sector ${i} ${e.type} baseSpeed=${e.baseSpeed} expected ${def.speed * speedMult}`
        );
        seen += 1;
      }
    }
  }

  assert.ok(seen >= 20, `expected a full campaign roster, got ${seen}`);
});
