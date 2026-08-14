import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SCORE_ARMORED,
  SCORE_MINIBOSS,
  SCORE_REX,
  SCORE_REX_BOSS,
  SCORE_STOMP,
  SCORE_TURRET,
} from "../src/constants.js";
import {
  buildLevel,
  ENEMY_TYPES,
  getLevelCount,
  getLivingBoss,
  isExitLocked,
} from "../src/level.js";
import { configureRunMode, level } from "../src/state.js";

test("ENEMY_TYPES score fields stay aligned with SCORE_* constants", () => {
  assert.equal(ENEMY_TYPES.drone.score, SCORE_STOMP);
  assert.equal(ENEMY_TYPES.climber.score, SCORE_STOMP);
  assert.equal(ENEMY_TYPES.needle.score, SCORE_STOMP);
  assert.equal(ENEMY_TYPES.swarm.score, SCORE_STOMP);
  assert.equal(ENEMY_TYPES.armored.score, SCORE_ARMORED);
  assert.equal(ENEMY_TYPES.turret.score, SCORE_TURRET);
  assert.equal(ENEMY_TYPES.rex.score, SCORE_REX);
  assert.equal(ENEMY_TYPES.towerSentinel.score, SCORE_MINIBOSS);
  assert.equal(ENEMY_TYPES.rexBoss.score, SCORE_REX_BOSS);
});

test("every campaign sector builds without throwing", () => {
  const n = getLevelCount();
  assert.ok(n >= 7, "campaign has at least 7 sectors");
  for (let i = 0; i < n; i++) {
    assert.doesNotThrow(() => buildLevel(i), `buildLevel(${i})`);
    assert.ok(level.platforms.length > 0, `sector ${i} has platforms`);
    assert.ok(level.exit.w > 0 && level.exit.h > 0, `sector ${i} has an exit`);
  }
});

test("boss placement: sentinel on Ascender, rexBoss only on the finale", () => {
  const n = getLevelCount();
  const finale = n - 1;

  for (let i = 0; i < n; i++) {
    buildLevel(i);
    const types = level.enemies.map((e) => e.type);
    const hasSentinel = types.includes("towerSentinel");
    const hasRexBoss = types.includes("rexBoss");

    if (i === 1) {
      assert.equal(hasSentinel, true, "Ascender hosts Tower Sentinel");
      assert.equal(getLivingBoss()?.type, "towerSentinel");
      assert.equal(isExitLocked(), true);
    } else {
      assert.equal(hasSentinel, false, `sector ${i} has no Tower Sentinel`);
    }

    if (i === finale) {
      assert.equal(hasRexBoss, true, "finale hosts Cyber-Rex boss");
      assert.equal(getLivingBoss()?.type, "rexBoss");
      assert.equal(isExitLocked(), true);
    } else {
      assert.equal(hasRexBoss, false, `sector ${i} has no rexBoss`);
    }
  }

  buildLevel(0);
  assert.equal(isExitLocked(), false, "Grid Sprint exit is unlocked");
  assert.equal(getLivingBoss(), null);
});

test("turrets spawn on Needle Path, Swarm Grid, and Blackout Run in LOCKDOWN only", () => {
  const expected = { 2: 2, 3: 1, 5: 1 };

  configureRunMode("normal");
  for (const index of Object.keys(expected)) {
    buildLevel(Number(index));
    const turrets = level.enemies.filter((e) => e.turret || e.type === "turret");
    assert.equal(turrets.length, 0, `sector ${index} has no turrets on a normal run`);
  }

  configureRunMode("lockdown");
  for (const [index, count] of Object.entries(expected)) {
    buildLevel(Number(index));
    const turrets = level.enemies.filter((e) => e.turret || e.type === "turret");
    assert.equal(turrets.length, count, `sector ${index} turret count in lockdown`);
    for (const t of turrets) {
      assert.equal(t.vx, 0);
      assert.equal(t.hp, 2);
    }
  }

  configureRunMode("timeAttack", 2);
  buildLevel(2);
  assert.equal(
    level.enemies.filter((e) => e.turret || e.type === "turret").length,
    0,
    "time trial does not spawn turrets"
  );
});
