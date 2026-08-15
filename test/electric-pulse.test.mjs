import { test } from "node:test";
import assert from "node:assert/strict";
import { electricHazardPulse } from "../src/level.js";

test("electricHazardPulse oscillates between 0 and 1 over a beat", () => {
  const beat = 0.5;
  assert.equal(electricHazardPulse(0, beat), 0.5);
  assert.ok(Math.abs(electricHazardPulse(beat / 4, beat) - 1) < 1e-9, "peak at quarter beat");
  assert.ok(Math.abs(electricHazardPulse(beat / 2, beat) - 0.5) < 1e-9);
  assert.ok(Math.abs(electricHazardPulse((3 * beat) / 4, beat) - 0) < 1e-9, "trough at 3/4");
});
