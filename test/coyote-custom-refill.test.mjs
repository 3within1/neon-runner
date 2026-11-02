import { test } from "node:test";
import assert from "node:assert/strict";
import { COYOTE_TIME, JUMP_BUFFER } from "../src/constants.js";
import { tickCoyote, tickJumpBuffer } from "../src/state.js";

/**
 * Coyote / jump-buffer helpers take an optional refill so modes or future
 * power-ups can stretch the window. A wrong default ignore would silently
 * clamp every call back to the campaign constants.
 */
test("tickCoyote accepts a custom grounded refill", () => {
  assert.equal(tickCoyote(0, true, 1 / 60, 0.25), 0.25);
  assert.equal(tickCoyote(0, true, 1 / 60), COYOTE_TIME, "default refill unchanged");
  assert.ok(
    Math.abs(tickCoyote(0.2, false, 0.05, 0.25) - 0.15) < 1e-9,
    "airborne still decays"
  );
  assert.equal(tickCoyote(0.02, false, 0.05, 0.25), 0, "decay clamps at zero");
});

test("tickJumpBuffer accepts a custom press refill", () => {
  assert.equal(tickJumpBuffer(0, true, 1 / 60, 0.3), 0.3);
  assert.equal(tickJumpBuffer(0, true, 1 / 60), JUMP_BUFFER, "default refill unchanged");
  assert.ok(Math.abs(tickJumpBuffer(0.2, false, 0.05, 0.3) - 0.15) < 1e-9);
  assert.equal(tickJumpBuffer(0.01, false, 0.05, 0.3), 0);
});
