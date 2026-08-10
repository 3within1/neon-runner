import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import {
  buildLevel,
  enemyBody,
  getLevelCount,
  getLivingBoss,
  isExitLocked,
} from "../src/level.js";

test("buildLevel does not throw for every campaign index", () => {
  const n = getLevelCount();
  for (let i = 0; i < n; i++) {
    assert.doesNotThrow(() => buildLevel(i), `buildLevel(${i})`);
  }
});

test("Ascender sentinel gates exit and patrols the summit arena", () => {
  buildLevel(1);
  const boss = getLivingBoss();
  assert.ok(boss, "living boss exists");
  assert.equal(boss.type, "towerSentinel");
  assert.equal(isExitLocked(), true);
  assert.ok(boss.minX >= 48 * TILE, "patrol min stays on summit");
  assert.ok(boss.maxX <= 62 * TILE, "patrol max stays on summit");
});

test("Rex Core boss gates exit until defeated", () => {
  buildLevel(6);
  const boss = getLivingBoss();
  assert.ok(boss, "living boss exists");
  assert.equal(boss.type, "rexBoss");
  assert.equal(isExitLocked(), true);
  boss.alive = false;
  assert.equal(isExitLocked(), false);
});

test("enemyBody uses raw bounds for grounded enemies", () => {
  const e = { x: 12, y: 34, w: 36, h: 28, grounded: true, bob: 1.2, bobAmp: 3, axis: "x" };
  assert.deepEqual(enemyBody(e), { x: 12, y: 34, w: 36, h: 28 });
});

test("enemyBody offsets y for horizontal flyers by sin(bob)*bobAmp", () => {
  const bob = 1.25;
  const bobAmp = 4;
  const e = { x: 10, y: 20, w: 30, h: 24, grounded: false, bob, bobAmp, axis: "x" };
  const body = enemyBody(e);
  assert.equal(body.x, 10);
  assert.equal(body.w, 30);
  assert.equal(body.h, 24);
  assert.equal(body.y, 20 + Math.sin(bob) * bobAmp);
});
