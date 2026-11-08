import { test } from "node:test";
import assert from "node:assert/strict";
import { tickJumpBuffer } from "../src/state.js";

test("tickJumpBuffer with negative dt extends an unpressed buffer", () => {
  const next = tickJumpBuffer(0.08, false, -0.05);
  assert.ok(Math.abs(next - 0.13) < 1e-9, `got ${next}`);
  assert.equal(tickJumpBuffer(0.02, false, 0.05), 0, "positive dt still decays to zero");
});
