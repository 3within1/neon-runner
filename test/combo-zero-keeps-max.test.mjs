import { test } from "node:test";
import assert from "node:assert/strict";
import {
  combo,
  maxCombo,
  resetRunStats,
  setCombo,
  setComboTimer,
  tickCombo,
} from "../src/state.js";

/**
 * End-screen / leaderboard honesty depends on maxCombo surviving the live
 * combo resetting to 0 when the window expires (or an explicit setCombo(0)).
 */
test("maxCombo survives live combo reset to zero", () => {
  resetRunStats();
  setCombo(6);
  assert.equal(maxCombo, 6);

  setCombo(0);
  assert.equal(combo, 0);
  assert.equal(maxCombo, 6, "explicit zero must not erase the peak");

  setCombo(3);
  setComboTimer(0.01);
  tickCombo(0.02);
  assert.equal(combo, 0, "window expiry clears the live combo");
  assert.equal(maxCombo, 6, "peak still retained for the run summary");
});
