import { test } from "node:test";
import assert from "node:assert/strict";
import { ENEMY_TYPES } from "../src/level.js";

// v2.0.11 planted LOCKDOWN turrets by marking the type grounded so spawnEnemy
// snaps feet to the pad. Losing that flag floats guns 12px above the floor.

test("turret type is grounded and flagged as a turret emplacement", () => {
  const t = ENEMY_TYPES.turret;
  assert.equal(t.grounded, true);
  assert.equal(t.turret, true);
  assert.equal(t.speed, 0);
  assert.equal(t.bobAmp, 0);
  assert.equal(t.hp, 2);
});

test("aerial drones are not grounded (must keep authored Y)", () => {
  assert.equal(ENEMY_TYPES.drone.grounded, undefined);
  assert.equal(ENEMY_TYPES.needle.grounded, undefined);
  assert.equal(ENEMY_TYPES.swarm.grounded, undefined);
  assert.equal(ENEMY_TYPES.climber.grounded, undefined);
});
