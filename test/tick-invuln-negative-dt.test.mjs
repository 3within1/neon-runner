import { test } from "node:test";
import assert from "node:assert/strict";
import { tickInvuln } from "../src/state.js";

test("tickInvuln with negative dt lengthens finite iframes", () => {
  assert.equal(tickInvuln(0.5, -0.1), 0.6);
  assert.equal(tickInvuln(0, -0.1), 0, "non-positive invuln stays cleared");
  assert.equal(tickInvuln(Infinity, -1), Infinity, "death-replay Infinity stays put");
});
