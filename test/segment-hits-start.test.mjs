import { test } from "node:test";
import assert from "node:assert/strict";
import { rect, segmentHitsRect } from "../src/physics.js";

/**
 * Thin hazard sweeps sample the swept AABB including t=0. Standing already
 * inside a laser/spike volume must register a hit even when the end sample
 * has left the rect.
 */
test("segmentHitsRect detects overlap on the starting sample", () => {
  const hazard = rect(40, 40, 20, 20);
  assert.equal(
    segmentHitsRect(45, 45, 200, 200, 10, 10, hazard),
    true,
    "start pose overlaps the hazard"
  );
  assert.equal(
    segmentHitsRect(0, 0, 5, 5, 8, 8, hazard),
    false,
    "path that never enters still misses"
  );
});
