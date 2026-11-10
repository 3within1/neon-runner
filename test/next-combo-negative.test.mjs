import { test } from "node:test";
import assert from "node:assert/strict";
import { nextComboOnStomp } from "../src/state.js";

/**
 * Combo chain requires currentCombo > 0. A corrupted negative combo (or a
 * caller that passes maxCombo leftovers incorrectly) must restart at 1, not
 * climb further into negative / zero bonus land.
 */
test("nextComboOnStomp restarts at 1 when current combo is non-positive", () => {
  assert.equal(nextComboOnStomp(-3, 1), 1);
  assert.equal(nextComboOnStomp(0, 1), 1);
  assert.equal(nextComboOnStomp(2, 0.5), 3, "positive chain still extends");
});
