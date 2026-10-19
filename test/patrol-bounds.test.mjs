import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clampPatrolToPlatform,
  platformUnderFeet,
} from "../src/physics.js";

function foe(overrides = {}) {
  return {
    x: 40,
    y: 160,
    w: 36,
    h: 40,
    minX: 0,
    maxX: 400,
    ...overrides,
  };
}

test("platformUnderFeet returns the widest solid pad under midX within feet slack", () => {
  const platforms = [
    { x: 0, y: 200, w: 80, h: 16 },
    { x: 10, y: 200, w: 160, h: 16 },
  ];
  const e = foe({ x: 40, y: 160 });
  const plat = platformUnderFeet(platforms, e);
  assert.ok(plat);
  assert.equal(plat.w, 160, "prefers the wider overlapping pad");
});

test("platformUnderFeet skips fallen pads and off-column probes", () => {
  const platforms = [
    { x: 0, y: 200, w: 100, h: 16, fallen: true },
    { x: 200, y: 200, w: 100, h: 16 },
  ];
  const e = foe({ x: 20, y: 160 });
  assert.equal(platformUnderFeet(platforms, e, 40), null, "fallen pad ignored");
  assert.equal(platformUnderFeet(platforms, e, 150), null, "empty column");
  assert.ok(platformUnderFeet(platforms, e, 250), "solid pad under probe X");
});

test("platformUnderFeet rejects pads outside the feet Y slack band", () => {
  const platforms = [{ x: 0, y: 280, w: 200, h: 16 }];
  const e = foe({ x: 40, y: 160 }); // feetY = 200; pad at 280 is 80px away
  assert.equal(platformUnderFeet(platforms, e), null);
});

test("clampPatrolToPlatform shrinks an oversized patrol onto the pad lips", () => {
  const e = foe({ minX: 0, maxX: 500, x: 40 });
  const plat = { x: 100, w: 120 };
  assert.equal(clampPatrolToPlatform(e, plat), true);
  assert.equal(e.minX, 102);
  assert.equal(e.maxX, 218);
  assert.equal(e.x, 102, "x pulled onto the shrunk span");
});

test("clampPatrolToPlatform resets when the intersected span is thinner than the body", () => {
  // Declared patrol barely overlaps the pad → intersect width < body width.
  const e = foe({ w: 48, minX: 175, maxX: 178, x: 175 });
  const plat = { x: 100, w: 80 }; // full padded pad is still wide enough for the body
  clampPatrolToPlatform(e, plat);
  assert.equal(e.minX, 102, "falls back to full padded pad");
  assert.equal(e.maxX, 178);
  assert.ok(e.maxX - e.minX >= e.w, "span can hold the body");
  assert.equal(e.x, 130, "x parked inside the reset span");
});

test("clampPatrolToPlatform is a no-op without a supporting pad", () => {
  const e = foe({ minX: 10, maxX: 90, x: 20 });
  assert.equal(clampPatrolToPlatform(e, null), false);
  assert.equal(e.minX, 10);
  assert.equal(e.maxX, 90);
  assert.equal(e.x, 20);
});

test("clampPatrolToPlatform clamps x that already sits past the right lip", () => {
  const e = foe({ minX: 0, maxX: 400, x: 300, w: 40 });
  const plat = { x: 0, w: 200 };
  clampPatrolToPlatform(e, plat, 2);
  assert.equal(e.maxX, 198);
  assert.equal(e.x, 158, "x parked at maxX - w");
});
