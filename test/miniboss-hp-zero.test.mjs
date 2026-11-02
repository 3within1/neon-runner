import { test } from "node:test";
import assert from "node:assert/strict";
import { minibossPhaseFromHp } from "../src/level.js";

/**
 * Tower Sentinel phase uses absolute HP thresholds. A finishing blow that
 * lands on 0 (or overshoots negative) must stay in the enraged/final band,
 * not fall through to phase 1.
 */
test("minibossPhaseFromHp treats zero and negative HP as phase 3", () => {
  assert.equal(minibossPhaseFromHp(0), 3);
  assert.equal(minibossPhaseFromHp(-1), 3);
  assert.equal(minibossPhaseFromHp(2), 3, "hp==2 is already the final band");
  assert.equal(minibossPhaseFromHp(3), 2);
  assert.equal(minibossPhaseFromHp(4), 1);
});
