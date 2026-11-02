import { test } from "node:test";
import assert from "node:assert/strict";
import { aabb, rect } from "../src/physics.js";

/**
 * Degenerate (zero-area) boxes show up as collapsed hazard draws / tip probes.
 * Overlap must stay false for a zero-size box that only touches an edge, and
 * true only when the point-like box sits strictly inside the other.
 */
test("aabb treats zero-size boxes as point probes with strict overlap", () => {
  const solid = rect(10, 10, 20, 20);
  assert.equal(aabb(rect(10, 10, 0, 0), solid), false, "corner point does not overlap");
  assert.equal(aabb(rect(15, 15, 0, 0), solid), true, "interior point overlaps");
  assert.equal(aabb(rect(30, 15, 0, 0), solid), false, "right edge point is exclusive");
  assert.equal(aabb(rect(0, 0, 10, 10), rect(10, 0, 0, 10)), false, "zero-width flush miss");
  assert.equal(aabb(rect(0, 0, 10, 10), rect(5, 5, 0, 0)), true, "point inside solid");
});
