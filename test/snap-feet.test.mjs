import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import { snapFeetToNearestPlatform } from "../src/physics.js";

function enemy(x, y, w = 40, h = 36) {
  return { x, y, w, h, minY: y, maxY: y + h };
}

test("snapFeetToNearestPlatform plants feet on the nearest solid pad under midX", () => {
  const platforms = [
    { x: 0, y: 200, w: 120, h: 16 },
    { x: 200, y: 160, w: 80, h: 16 },
  ];
  const e = enemy(20, 140);
  const top = snapFeetToNearestPlatform(platforms, e);
  assert.equal(top, 200);
  assert.equal(e.y, 200 - e.h, "feet sit flush on the pad (turret float bug)");
  assert.equal(e.minY, e.y);
  assert.equal(e.maxY, e.y + e.h);
});

test("snapFeetToNearestPlatform prefers the highest pad still under the entity", () => {
  const platforms = [
    { x: 0, y: 300, w: 200, h: 16 },
    { x: 0, y: 220, w: 200, h: 16 },
  ];
  const e = enemy(40, 180);
  assert.equal(snapFeetToNearestPlatform(platforms, e), 220);
  assert.equal(e.y, 220 - e.h);
});

test("snapFeetToNearestPlatform ignores fallen pads and off-column floors", () => {
  const platforms = [
    { x: 0, y: 200, w: 80, h: 16, fallen: true },
    { x: 400, y: 180, w: 80, h: 16 },
  ];
  const e = enemy(10, 150);
  assert.equal(snapFeetToNearestPlatform(platforms, e), null);
  assert.equal(e.y, 150, "entity left untouched when no pad matches");
});

test("snapFeetToNearestPlatform skips pads more than lookBack above the entity", () => {
  const platforms = [{ x: 0, y: 40, w: 120, h: 16 }];
  const e = enemy(10, 40 + TILE + 1);
  assert.equal(snapFeetToNearestPlatform(platforms, e), null);
  e.y = 40 + TILE;
  assert.equal(snapFeetToNearestPlatform(platforms, e), 40);
});
