import { test } from "node:test";
import assert from "node:assert/strict";
import { ENEMY_TYPES } from "../src/level.js";

test("ENEMY_TYPES combat flags stay consistent for bosses, turrets, and aerials", () => {
  const aerials = ["drone", "climber", "needle", "swarm", "armored"];
  for (const id of aerials) {
    const t = ENEMY_TYPES[id];
    assert.equal(!!t.grounded, false, `${id} is aerial`);
    assert.equal(!!t.boss, false, `${id} is not a boss`);
    assert.equal(!!t.turret, false, `${id} is not a turret`);
    assert.ok(t.speed > 0, `${id} patrols`);
  }

  assert.equal(ENEMY_TYPES.turret.turret, true);
  assert.equal(ENEMY_TYPES.turret.grounded, true);
  assert.equal(ENEMY_TYPES.turret.speed, 0);
  assert.equal(!!ENEMY_TYPES.turret.boss, false);

  assert.equal(ENEMY_TYPES.towerSentinel.boss, true);
  assert.equal(ENEMY_TYPES.towerSentinel.miniboss, true);
  assert.equal(ENEMY_TYPES.towerSentinel.chase, true);
  assert.equal(ENEMY_TYPES.towerSentinel.grounded, true);

  assert.equal(ENEMY_TYPES.rexBoss.boss, true);
  assert.equal(!!ENEMY_TYPES.rexBoss.miniboss, false);
  assert.equal(ENEMY_TYPES.rexBoss.chase, true);
  assert.equal(ENEMY_TYPES.rexBoss.grounded, true);
  assert.ok(ENEMY_TYPES.rexBoss.hp > ENEMY_TYPES.towerSentinel.hp);

  assert.equal(ENEMY_TYPES.rex.grounded, true);
  assert.equal(!!ENEMY_TYPES.rex.boss, false);
  assert.equal(ENEMY_TYPES.rex.hp, 3);
});
