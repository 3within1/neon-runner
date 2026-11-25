import { test } from "node:test";
import assert from "node:assert/strict";
import { LOCKDOWN_SPEED_MULT } from "../src/constants.js";
import { buildLevel, ENEMY_TYPES } from "../src/level.js";
import { configureRunMode, level } from "../src/state.js";

/**
 * configureRunMode sets enemySpeedMult, but difficulty only changes if spawnEnemy
 * multiplies def.speed into both speed and baseSpeed. A missed wire leaves
 * LOCKDOWN looking identical to Jack In while the HUD still claims hard mode.
 */

test("LOCKDOWN scales spawned enemy speed and baseSpeed by LOCKDOWN_SPEED_MULT", () => {
  configureRunMode("normal");
  buildLevel(0);
  const normal = level.enemies.find((e) => e.type === "drone");
  assert.ok(normal, "Grid Sprint spawns drones");
  assert.equal(normal.speed, ENEMY_TYPES.drone.speed);
  assert.equal(normal.baseSpeed, ENEMY_TYPES.drone.speed);

  configureRunMode("lockdown");
  buildLevel(0);
  const locked = level.enemies.find((e) => e.type === "drone");
  assert.ok(locked, "lockdown still spawns drones");
  const expected = ENEMY_TYPES.drone.speed * LOCKDOWN_SPEED_MULT;
  assert.equal(locked.speed, expected);
  assert.equal(locked.baseSpeed, expected);
  assert.ok(locked.speed > normal.speed, "lockdown drones outpace normal");

  configureRunMode("normal");
});

test("time attack and Jack In keep catalog speeds after a lockdown rebuild", () => {
  configureRunMode("lockdown");
  buildLevel(0);

  configureRunMode("timeAttack", 0);
  buildLevel(0);
  const trial = level.enemies.find((e) => e.type === "drone");
  assert.ok(trial);
  assert.equal(trial.speed, ENEMY_TYPES.drone.speed, "time trial must not inherit lockdown speed");
  assert.equal(trial.baseSpeed, ENEMY_TYPES.drone.speed);

  configureRunMode("normal");
  buildLevel(0);
  const jackIn = level.enemies.find((e) => e.type === "drone");
  assert.equal(jackIn.speed, ENEMY_TYPES.drone.speed);
  assert.equal(jackIn.baseSpeed, ENEMY_TYPES.drone.speed);
});

test("LOCKDOWN scales armored and sentinel catalog speeds the same way", () => {
  configureRunMode("lockdown");
  buildLevel(1); // Ascender hosts Tower Sentinel
  const sentinel = level.enemies.find((e) => e.type === "towerSentinel");
  assert.ok(sentinel, "Ascender hosts Tower Sentinel");
  assert.equal(
    sentinel.speed,
    ENEMY_TYPES.towerSentinel.speed * LOCKDOWN_SPEED_MULT
  );
  assert.equal(
    sentinel.baseSpeed,
    ENEMY_TYPES.towerSentinel.speed * LOCKDOWN_SPEED_MULT
  );

  buildLevel(4); // Overclock Span includes armored
  const armored = level.enemies.find((e) => e.type === "armored");
  assert.ok(armored, "Overclock Span spawns armored");
  assert.equal(armored.speed, ENEMY_TYPES.armored.speed * LOCKDOWN_SPEED_MULT);
  assert.equal(
    armored.baseSpeed,
    ENEMY_TYPES.armored.speed * LOCKDOWN_SPEED_MULT
  );

  configureRunMode("normal");
});
