import { test } from "node:test";
import assert from "node:assert/strict";
import { tickInvuln } from "../src/state.js";

/**
 * Non-finite invuln (Infinity during death replay) must not decay. NaN is also
 * non-finite — document that it stays put rather than collapsing to 0, which
 * would silently re-arm hurt checks after a bad timer write.
 */
test("tickInvuln preserves NaN the same way it preserves Infinity", () => {
  assert.ok(Number.isNaN(tickInvuln(Number.NaN, 0.2)));
  assert.ok(Number.isNaN(tickInvuln(Number.NaN, 1)));
  assert.equal(tickInvuln(Infinity, 1), Infinity);
  assert.equal(tickInvuln(0.5, 0.2), 0.3, "finite timers still decay");
});
