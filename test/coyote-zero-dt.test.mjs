import { test } from "node:test";
import assert from "node:assert/strict";
import { COYOTE_TIME, JUMP_BUFFER } from "../src/constants.js";
import { tickCoyote, tickJumpBuffer } from "../src/state.js";

/**
 * Hit-stop frames pass dt=0 into mobility timers. Grounded coyote must still
 * refill; airborne coyote / jump buffer must not decay on a frozen frame.
 */
test("tickCoyote and tickJumpBuffer are stable at dt 0", () => {
  assert.equal(tickCoyote(0, true, 0), COYOTE_TIME, "grounded refill ignores dt");
  assert.equal(tickCoyote(0.08, false, 0), 0.08, "airborne coyote holds while frozen");

  assert.equal(tickJumpBuffer(0, true, 0), JUMP_BUFFER, "press still refills at dt 0");
  assert.equal(tickJumpBuffer(0.08, false, 0), 0.08, "buffer holds while frozen");
});
