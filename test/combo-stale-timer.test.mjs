import { test } from "node:test";
import assert from "node:assert/strict";
import { comboBonusForStomp, nextComboOnStomp } from "../src/state.js";
import { COMBO_BONUS_DATA, COMBO_BONUS_EVERY } from "../src/constants.js";

/**
 * A leftover combo count with an expired (or overshot-negative) window must
 * restart at 1 — otherwise a late stomp can claim a milestone bonus from a
 * chain that already timed out.
 */
test("nextComboOnStomp restarts when the combo window is expired or negative", () => {
  assert.equal(nextComboOnStomp(6, 0), 1);
  assert.equal(nextComboOnStomp(6, -0.01), 1);
  assert.equal(nextComboOnStomp(6, 0.01), 7, "tiny positive window still chains");
});

test("comboBonusForStomp ignores non-positive and non-milestone chains", () => {
  assert.equal(comboBonusForStomp(-3), 0);
  assert.equal(comboBonusForStomp(COMBO_BONUS_EVERY + 1), 0);
  assert.equal(comboBonusForStomp(COMBO_BONUS_EVERY), COMBO_BONUS_DATA);
});
