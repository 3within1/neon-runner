import { test } from "node:test";
import assert from "node:assert/strict";
import { JUMP_BUFFER } from "../src/constants.js";
import { tickJumpBuffer } from "../src/state.js";

/**
 * A jump press must refresh the buffer even when dt alone would have drained
 * the previous remainder to zero. Otherwise a same-frame land+press can lose
 * the buffered jump to decay order.
 */
test("tickJumpBuffer prefers press refresh over decay in the same step", () => {
  assert.equal(tickJumpBuffer(0.01, true, 1), JUMP_BUFFER);
  assert.equal(tickJumpBuffer(0, true, 5), JUMP_BUFFER);
  assert.equal(tickJumpBuffer(JUMP_BUFFER, false, JUMP_BUFFER + 1), 0, "no press still decays to zero");
});
