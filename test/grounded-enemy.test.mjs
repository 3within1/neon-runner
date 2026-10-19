import { test } from "node:test";
import assert from "node:assert/strict";
import { constrainGroundedEnemy } from "../src/level.js";

function makePad(x, y, w = 200) {
  return { x, y, w, h: 24 };
}

function makeEnemy(overrides = {}) {
  return {
    x: 80,
    y: 160,
    w: 40,
    h: 40,
    vx: 80,
    grounded: true,
    airborne: false,
    minX: 0,
    maxX: 400,
    baseSpeed: 80,
    charging: 0.5,
    ...overrides,
  };
}

test("constrainGroundedEnemy reverses at a leading lip and cancels charge", () => {
  // Pad ends just before the right lead probe (x + w - 6 = 114 when x=80).
  const platforms = [makePad(0, 200, 110)];
  const e = makeEnemy({ x: 80, vx: 80 });
  assert.equal(constrainGroundedEnemy(platforms, e), true);
  assert.ok(e.vx < 0, "velocity flips inward from the right lip");
  assert.equal(e.charging, 0);
  assert.equal(e.y, 160, "feet stay planted on the pad top");
});

test("constrainGroundedEnemy snaps feet to the pad under mid when supported", () => {
  const platforms = [makePad(0, 200, 400)];
  const e = makeEnemy({ y: 155, vx: 40 });
  assert.equal(constrainGroundedEnemy(platforms, e), false);
  assert.equal(e.y, 160);
  assert.equal(e.vx, 40);
  assert.equal(e.charging, 0.5);
});

test("constrainGroundedEnemy skips airborne or non-grounded bodies", () => {
  const platforms = [makePad(0, 200, 50)];
  const air = makeEnemy({ airborne: true, vx: 80 });
  assert.equal(constrainGroundedEnemy(platforms, air), false);
  assert.equal(air.vx, 80);

  const floating = makeEnemy({ grounded: false, vx: 80 });
  assert.equal(constrainGroundedEnemy(platforms, floating), false);
  assert.equal(floating.vx, 80);
});

test("constrainGroundedEnemy reverses at a left lip", () => {
  // Left lead probe is x + 6; pad starts at 50 so walking left off 40.. falls.
  const platforms = [makePad(50, 200, 300)];
  const e = makeEnemy({ x: 40, vx: -80 });
  assert.equal(constrainGroundedEnemy(platforms, e), true);
  assert.ok(e.vx > 0, "velocity flips inward from the left lip");
  assert.equal(e.charging, 0);
});
