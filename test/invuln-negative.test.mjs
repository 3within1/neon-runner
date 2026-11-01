import { test } from "node:test";
import assert from "node:assert/strict";
import { tickInvuln } from "../src/state.js";

// After a hit resolves, callers may pass a slightly negative remainder from
// float math. Negative must clamp to 0 so bolts/hazards can hurt again.

test("tickInvuln clamps non-positive finite timers to zero", () => {
  assert.equal(tickInvuln(-0.001, 1 / 60), 0);
  assert.equal(tickInvuln(-5, 0.2), 0);
  assert.equal(tickInvuln(0, 0.2), 0);
});

test("tickInvuln preserves the Infinity timer used by death replay", () => {
  assert.equal(tickInvuln(Infinity, 1), Infinity);
});
