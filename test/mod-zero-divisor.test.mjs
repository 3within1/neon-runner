import { test } from "node:test";
import assert from "node:assert/strict";
import { mod } from "../src/physics.js";

/**
 * `mod` wraps animation / laser / bob phases. A zero period (bad theme BPM →
 * beat length 0) yields NaN via `% 0`. Document the contract so a harden to a
 * finite fallback is intentional and so callers that pass m=0 fail loudly in CI
 * instead of silently painting NaN into draw math.
 */
test("mod returns NaN when the divisor is zero", () => {
  assert.equal(Number.isNaN(mod(1, 0)), true);
  assert.equal(Number.isNaN(mod(0, 0)), true);
  assert.equal(Number.isNaN(mod(-3, 0)), true);
});

test("mod still wraps negatives into [0, m) for positive divisors", () => {
  assert.equal(mod(-1, 4), 3);
  assert.equal(mod(4, 4), 0);
});
