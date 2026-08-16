import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import {
  bossChaseTunables,
  bossPlayerInArena,
  resolveBossArenaBounds,
  shouldBossStartCharge,
  shouldBossStartSlam,
} from "../src/level.js";

test("bossChaseTunables scales chase/charge/slam by phase", () => {
  const p1 = bossChaseTunables(1);
  assert.equal(p1.chaseMult, 1);
  assert.equal(p1.chargeMult, 2.85);
  assert.equal(p1.chargeDur, 0.7);
  assert.equal(p1.chargeCd, 1.35);
  assert.equal(p1.slamCooldown, 1.6);
  assert.equal(p1.slamVy, -620);

  const p2 = bossChaseTunables(2);
  assert.equal(p2.chaseMult, 1.2);
  assert.equal(p2.chargeMult, 3.1);
  assert.equal(p2.chargeCd, 1.1);
  assert.equal(p2.slamVy, -620);

  const p3 = bossChaseTunables(3);
  assert.equal(p3.chaseMult, 1.4);
  assert.equal(p3.chargeMult, 3.5);
  assert.equal(p3.chargeDur, 0.9);
  assert.equal(p3.chargeCd, 0.85);
  assert.equal(p3.slamCooldown, 1.1);
  assert.equal(p3.slamVy, -780);
});

test("shouldBossStartSlam only for Cyber-Rex in phase 2+ when ready", () => {
  const ready = {
    inArena: true,
    miniboss: false,
    phase: 2,
    slamTimer: 0,
    charging: 0,
    dist: 200,
  };
  assert.equal(shouldBossStartSlam(ready), true);
  assert.equal(shouldBossStartSlam({ ...ready, miniboss: true }), false);
  assert.equal(shouldBossStartSlam({ ...ready, phase: 1 }), false);
  assert.equal(shouldBossStartSlam({ ...ready, slamTimer: 0.5 }), false);
  assert.equal(shouldBossStartSlam({ ...ready, charging: 0.2 }), false);
  assert.equal(shouldBossStartSlam({ ...ready, dist: 360 }), false);
  assert.equal(shouldBossStartSlam({ ...ready, inArena: false }), false);
});

test("shouldBossStartCharge requires the mid-range band and a ready cooldown", () => {
  assert.equal(shouldBossStartCharge(100, 0), true);
  assert.equal(shouldBossStartCharge(40, 0), false, "too close");
  assert.equal(shouldBossStartCharge(480, 0), false, "too far");
  assert.equal(shouldBossStartCharge(100, 0.01), false, "cooling down");
});

test("bossPlayerInArena uses a TILE*4 engagement margin", () => {
  const minX = 1000;
  const maxX = 1400;
  const margin = TILE * 4;
  assert.equal(bossPlayerInArena(minX - margin - 10, 40, minX, maxX), false);
  assert.equal(bossPlayerInArena(minX - margin, 40, minX, maxX), true);
  assert.equal(bossPlayerInArena(maxX + margin - 1, 40, minX, maxX), true);
  assert.equal(bossPlayerInArena(maxX + margin, 40, minX, maxX), false);
});

test("resolveBossArenaBounds clamps X and cancels charge on a wall hit", () => {
  const left = {
    x: 90,
    w: 80,
    vx: -200,
    minX: 100,
    maxX: 500,
    charging: 0.5,
  };
  assert.equal(resolveBossArenaBounds(left), true);
  assert.equal(left.x, 100);
  assert.equal(left.vx, 200);
  assert.equal(left.charging, 0);

  const right = {
    x: 440,
    w: 80,
    vx: 200,
    minX: 100,
    maxX: 500,
    charging: 0.4,
  };
  assert.equal(resolveBossArenaBounds(right), true);
  assert.equal(right.x, 420);
  assert.equal(right.vx, -200);
  assert.equal(right.charging, 0);

  const mid = {
    x: 200,
    w: 80,
    vx: 50,
    minX: 100,
    maxX: 500,
    charging: 0.3,
  };
  assert.equal(resolveBossArenaBounds(mid), false);
  assert.equal(mid.charging, 0.3);
});
