import { test } from "node:test";
import assert from "node:assert/strict";
import { COYOTE_TIME, JUMP_BUFFER } from "../src/constants.js";
import { tickCoyote, tickInvuln, tickJumpBuffer } from "../src/state.js";

test("tickCoyote refills on ground and decays in air", () => {
  assert.equal(tickCoyote(0, true, 1 / 60), COYOTE_TIME);
  assert.equal(tickCoyote(COYOTE_TIME, false, 0.05), COYOTE_TIME - 0.05);
  assert.equal(tickCoyote(0.02, false, 0.05), 0, "clamps at zero");
});

test("tickJumpBuffer refreshes on press and decays otherwise", () => {
  assert.equal(tickJumpBuffer(0, true, 1 / 60), JUMP_BUFFER);
  assert.equal(tickJumpBuffer(JUMP_BUFFER, false, 0.04), JUMP_BUFFER - 0.04);
  assert.equal(tickJumpBuffer(0.01, false, 0.05), 0);
});

test("tickInvuln decays finite timers but preserves Infinity", () => {
  assert.equal(tickInvuln(1.2, 0.2), 1.0);
  assert.equal(tickInvuln(0.1, 0.2), 0);
  assert.equal(tickInvuln(0, 0.2), 0);
  assert.equal(tickInvuln(Infinity, 1), Infinity, "death-replay invuln stays infinite");
});
