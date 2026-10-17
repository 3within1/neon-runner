import { test } from "node:test";
import assert from "node:assert/strict";
import { LOCKDOWN_SPEED_MULT } from "../src/constants.js";
import { buildLevel, ENEMY_TYPES } from "../src/level.js";
import { configureRunMode, level } from "../src/state.js";

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
