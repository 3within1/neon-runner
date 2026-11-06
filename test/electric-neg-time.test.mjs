import { test } from "node:test";
import assert from "node:assert/strict";
import { electricHazardPulse } from "../src/level.js";

/**
 * Sector clocks can be slightly negative during boot/reset ordering. The pulse
 * must stay in [0, 1] so hazard draw alpha never goes NaN or inverted.
 */
test("electricHazardPulse stays in unit range for negative nowSec", () => {
  const beat = 0.5;
  for (const t of [-0.01, -0.25, -beat, -2 * beat]) {
    const pulse = electricHazardPulse(t, beat);
    assert.ok(Number.isFinite(pulse), `finite at t=${t}`);
    assert.ok(pulse >= 0 && pulse <= 1, `in [0,1] at t=${t}, got ${pulse}`);
  }
  // Known phase: at -beat/4 the argument is -π/2 → sin = -1 → pulse = 0.
  assert.ok(Math.abs(electricHazardPulse(-beat / 4, beat) - 0) < 1e-9);
});
