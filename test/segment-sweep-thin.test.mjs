import { test } from "node:test";
import assert from "node:assert/strict";
import { rect, segmentHitsRect } from "../src/physics.js";

test("segmentHitsRect catches a thin vertical hazard mid-sweep", () => {
  // 4px spike between x=48..52; start/end boxes sit fully left / right of it.
  const spike = rect(48, 100, 4, 20);
  assert.equal(
    segmentHitsRect(0, 100, 80, 100, 28, 40, spike),
    true,
    "player-sized sweep must not tunnel through thin spikes"
  );
  assert.equal(
    segmentHitsRect(0, 160, 80, 160, 28, 40, spike),
    false,
    "parallel path below the spike misses"
  );
});

test("segmentHitsRect catches a thin horizontal laser on a vertical sweep", () => {
  const laser = rect(40, 50, 80, 4);
  assert.equal(
    segmentHitsRect(50, 0, 50, 100, 20, 20, laser),
    true,
    "falling through a laser band registers a hit"
  );
  assert.equal(
    segmentHitsRect(0, 0, 0, 100, 20, 20, laser),
    false,
    "sweep left of the laser band misses"
  );
});
