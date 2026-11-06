import { test } from "node:test";
import assert from "node:assert/strict";
import { advanceProjectile } from "../src/level.js";

/**
 * Hit-stop / paused frames can feed dt=0 into bolt stepping. Position and life
 * must stay put, and the input object must still not be mutated.
 */
test("advanceProjectile with dt 0 is an identity copy", () => {
  const original = { x: 40, y: 80, vx: 260, vy: 0, life: 1.5, w: 22, h: 12 };
  const snapshot = { ...original };
  const next = advanceProjectile(original, 0);

  assert.notEqual(next, original);
  assert.deepEqual(original, snapshot);
  assert.equal(next.x, 40);
  assert.equal(next.y, 80);
  assert.equal(next.life, 1.5);
  assert.equal(next.vx, 260);
});
