import { test } from "node:test";
import assert from "node:assert/strict";
import { COMBO_BONUS_DATA, COMBO_BONUS_EVERY } from "../src/constants.js";
import { comboBonusForStomp } from "../src/state.js";

/**
 * Bonus DATA requires nextCombo > 1 and a milestone multiple. Negatives and
 * the opening stomp must award nothing so a bad combo write cannot mint free
 * score on contact.
 */
test("comboBonusForStomp awards nothing for non-positive or non-milestone combos", () => {
  assert.equal(comboBonusForStomp(-COMBO_BONUS_EVERY), 0);
  assert.equal(comboBonusForStomp(-1), 0);
  assert.equal(comboBonusForStomp(1), 0);
  assert.equal(comboBonusForStomp(COMBO_BONUS_EVERY), COMBO_BONUS_DATA);
});
