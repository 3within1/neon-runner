import { test } from "node:test";
import assert from "node:assert/strict";
import { bossPhaseFromHp } from "../src/level.js";

test("bossPhaseFromHp clamps over-heal and zero maxHp into phase bands", () => {
  assert.equal(bossPhaseFromHp(15, 10), 1, "hp above maxHp stays phase 1");
  assert.equal(bossPhaseFromHp(0, 10), 3, "zero hp is enraged");
  // 10 / 0 → Infinity; Infinity > 0.62 so phase 1 today.
  assert.equal(bossPhaseFromHp(10, 0), 1, "zero maxHp yields Infinity ratio → phase 1");
  // NaN ratio falls through both thresholds to phase 3.
  assert.equal(bossPhaseFromHp(Number.NaN, 10), 3);
});
