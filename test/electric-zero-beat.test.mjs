import { test } from "node:test";
import assert from "node:assert/strict";
import { electricHazardPulse } from "../src/level.js";

/**
 * Sector themes always pass a positive beat length. A zero / non-finite beat
 * divides by zero inside the sine and yields NaN — which would freeze hazard
 * glow math if a theme ever authored BPM as 0. Document the contract so a
 * future harden (or a bad authoring change) is caught.
 */
test("electricHazardPulse stays finite in [0, 1] for positive beats", () => {
  for (const beat of [0.25, 0.5, 1, 1.2]) {
    for (let i = 0; i <= 8; i++) {
      const v = electricHazardPulse((beat * i) / 8, beat);
      assert.ok(Number.isFinite(v), `finite at i=${i} beat=${beat}`);
      assert.ok(v >= 0 && v <= 1, `in [0,1] at i=${i} beat=${beat}`);
    }
  }
});

test("electricHazardPulse yields NaN for zero or NaN beat lengths", () => {
  assert.equal(Number.isNaN(electricHazardPulse(0.1, 0)), true, "0 beat → NaN");
  assert.equal(Number.isNaN(electricHazardPulse(0, 0)), true);
  assert.equal(Number.isNaN(electricHazardPulse(0.1, Number.NaN)), true);
  // Infinity beat collapses the angle to 0, so the pulse is a finite mid value.
  assert.equal(electricHazardPulse(0.1, Number.POSITIVE_INFINITY), 0.5);
});
