import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import { makeTurretBolt, turretCanFire } from "../src/level.js";

test("turretCanFire requires ready cooldown, range, and level aim", () => {
  assert.equal(turretCanFire(0, TILE * 5, 0), true);
  assert.equal(turretCanFire(0.2, TILE * 5, 0), false, "cooldown blocks fire");
  assert.equal(turretCanFire(0, TILE * 14, 0), false, "range is exclusive at the edge");
  assert.equal(turretCanFire(0, TILE * 5, TILE * 3.5), false, "aim band is exclusive");
  assert.equal(turretCanFire(0, TILE * 5, -(TILE * 3)), true);
});

test("makeTurretBolt aims horizontally from the turret muzzle", () => {
  const e = { x: 100, y: 50, w: 40, h: 40 };
  const right = makeTurretBolt(e, 1);
  assert.equal(right.vx, 260);
  assert.equal(right.vy, 0);
  assert.equal(right.life, 2.6);
  assert.equal(right.w, 22);
  assert.equal(right.h, 12);
  assert.equal(right.x, e.x + e.w * 0.5 - 10 + 14);
  assert.equal(right.y, e.y + e.h * 0.3);

  const left = makeTurretBolt(e, -1);
  assert.equal(left.vx, -260);
  assert.equal(left.x, e.x + e.w * 0.5 - 10 - 14);
});
