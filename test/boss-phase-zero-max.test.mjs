import { test } from "node:test";
import assert from "node:assert/strict";
import { bossPhaseFromHp, minibossPhaseFromHp } from "../src/level.js";

/**
 * Cyber-Rex phase uses hp/maxHp. A zero maxHp (mis-authored spawn) must not
 * throw — current contract: positive hp → Infinity ratio → phase 1; 0/0 → NaN
 * falls through to enraged phase 3.
 */
test("bossPhaseFromHp tolerates zero maxHp without throwing", () => {
  assert.equal(bossPhaseFromHp(10, 0), 1, "positive hp / 0 → Infinity → phase 1");
  assert.equal(bossPhaseFromHp(0, 0), 3, "0/0 → NaN falls through to phase 3");
  assert.equal(bossPhaseFromHp(-1, 10), 3, "negative ratio is treated as enraged");
});

test("minibossPhaseFromHp floors depleted HP into phase 3", () => {
  assert.equal(minibossPhaseFromHp(0), 3);
  assert.equal(minibossPhaseFromHp(-2), 3);
  assert.equal(minibossPhaseFromHp(3), 2, "absolute threshold at 3 stays phase 2");
  assert.equal(minibossPhaseFromHp(3.1), 1);
});
