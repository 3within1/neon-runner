import { test } from "node:test";
import assert from "node:assert/strict";
import { advanceProjectile } from "../src/level.js";

/**
 * Bolt updates must not mutate the in-flight object — simulation replaces the
 * reference. Mutation would double-apply velocity if a caller also assigns fields.
 */
test("advanceProjectile returns a new object and leaves the input untouched", () => {
  const original = { x: 10, y: 20, vx: 100, vy: -40, life: 2.6, w: 22, h: 12 };
  const snapshot = { ...original };
  const next = advanceProjectile(original, 0.25);

  assert.notEqual(next, original, "must allocate a fresh bolt");
  assert.deepEqual(original, snapshot, "input bolt stays frozen");
  assert.equal(next.x, 35);
  assert.equal(next.y, 10);
  assert.equal(next.life, 2.35);
  assert.equal(next.w, 22);
  assert.equal(next.h, 12);
});
