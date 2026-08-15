import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import { floorYUnderEntity } from "../src/level.js";

test("floorYUnderEntity finds the platform under the feet X", () => {
  const platforms = [
    { x: 0, y: 200, w: 200, h: 24 },
    { x: 0, y: 80, w: 200, h: 24 },
  ];
  const e = { x: 40, y: 160, w: 36, h: 40 };
  assert.equal(floorYUnderEntity(platforms, e, 58), 200);
});

test("floorYUnderEntity ignores fallen pads and out-of-range X", () => {
  const platforms = [
    { x: 0, y: 200, w: 100, h: 24, fallen: true },
    { x: 200, y: 200, w: 100, h: 24 },
  ];
  const e = { x: 20, y: 160, w: 36, h: 40 };
  assert.equal(floorYUnderEntity(platforms, e, 40), null, "fallen pad skipped");
  assert.equal(floorYUnderEntity(platforms, e, 250), null, "X not under entity column");
});

test("floorYUnderEntity skips floors far above or below the feet band", () => {
  const platforms = [
    { x: 0, y: 0, w: 200, h: 24 },
    { x: 0, y: 400, w: 200, h: 24 },
  ];
  // feetY = 200; y=0 is above e.y - TILE; y=400 is past feetY + TILE/2
  const e = { x: 40, y: 160, w: 36, h: 40 };
  assert.equal(floorYUnderEntity(platforms, e, 58), null);
});
