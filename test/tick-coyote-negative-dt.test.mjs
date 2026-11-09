import { test } from "node:test";
import assert from "node:assert/strict";
import { tickCoyote } from "../src/state.js";
import { COYOTE_TIME } from "../src/constants.js";

test("tickCoyote with negative dt extends airborne coyote", () => {
  const next = tickCoyote(0.1, false, -0.05);
  assert.ok(Math.abs(next - 0.15) < 1e-9, `got ${next}`);
  assert.equal(tickCoyote(0, true, -0.05), COYOTE_TIME, "grounded still refills");
});
