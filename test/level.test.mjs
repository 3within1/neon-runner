import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import { buildLevel, enemyBody, getLivingBoss, solidPlatforms } from "../src/level.js";
import { wallClingDir } from "../src/physics.js";
import { level } from "../src/state.js";

test("Ascender sentinel patrols the summit arena", () => {
  buildLevel(1);
  const boss = getLivingBoss();
  assert.ok(boss, "living boss exists");
  assert.equal(boss.type, "towerSentinel");
  assert.ok(boss.minX >= 1 * TILE, "patrol min stays on summit");
  assert.ok(boss.maxX <= 19 * TILE, "patrol max stays on summit");
});

test("Ascender is a tall shaft so the camera can scroll up", () => {
  buildLevel(1);
  assert.ok(level.height >= 30 * TILE, "tall enough to scroll vertically");
  assert.ok(level.width <= 22 * TILE, "narrow enough that climb is the main axis");
  assert.ok(level.spawn.y > level.height * 0.7, "spawn is near the floor");
  assert.ok(level.exit.y < 4 * TILE, "exit is at the summit");
});

test("Ascender has tall cling shafts for wall jump", () => {
  buildLevel(1);
  const shafts = level.platforms.filter((p) => p.h >= 8 * TILE && p.w <= TILE);
  assert.ok(shafts.length >= 2, "expected mirrored cling shafts");
});

test("holding into an Ascender cling shaft registers wall contact", () => {
  buildLevel(1);
  const platforms = solidPlatforms();
  const left = platforms.find((p) => p.w <= TILE && p.h >= 8 * TILE && p.x < 20 * TILE);
  assert.ok(left, "left cling shaft");
  const box = { x: left.x - 28, y: left.y + 80, w: 28, h: 40 };
  assert.equal(wallClingDir(box, platforms, false, true), 1);
  assert.equal(wallClingDir(box, platforms, true, false), 0);
});

test("enemyBody uses raw bounds for grounded enemies", () => {
  const e = { x: 12, y: 34, w: 36, h: 28, grounded: true, bob: 1.2, bobAmp: 3, axis: "x" };
  assert.deepEqual(enemyBody(e), { x: 12, y: 34, w: 36, h: 28 });
});

test("enemyBody keeps grounded foes on raw bounds regardless of axis", () => {
  const e = { x: 12, y: 34, w: 36, h: 28, grounded: true, bob: 2, bobAmp: 6, axis: "y" };
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

test("enemyBody offsets x for vertical climbers by sin(bob)*bobAmp", () => {
  const bob = 0.75;
  const bobAmp = 5;
  const e = { x: 40, y: 80, w: 28, h: 32, grounded: false, bob, bobAmp, axis: "y" };
  const body = enemyBody(e);
  assert.equal(body.y, 80, "vertical bob does not shift y");
  assert.equal(body.w, 28);
  assert.equal(body.h, 32);
  assert.equal(body.x, 40 + Math.sin(bob) * bobAmp, "climber hitbox sways on x");
});
