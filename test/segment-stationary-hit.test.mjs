import { test } from "node:test";
import assert from "node:assert/strict";
import { rect, segmentHitsRect } from "../src/physics.js";

// Zero-length sweeps still sample the resting AABB (laser/spike already under
 // the player). Missing this path lets standing in a hazard deal no damage.

test("segmentHitsRect reports a hit for a zero-length sweep that already overlaps", () => {
  const hazard = rect(40, 40, 20, 20);
  assert.equal(segmentHitsRect(45, 45, 45, 45, 10, 10, hazard), true);
  assert.equal(
    segmentHitsRect(0, 0, 0, 0, 10, 10, hazard),
    false,
    "stationary miss beside the hazard stays false"
  );
});
