import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SCORE_ARMORED,
  SCORE_MINIBOSS,
  SCORE_PACK,
  SCORE_REX,
  SCORE_REX_BOSS,
  SCORE_STOMP,
  SCORE_TURRET,
} from "../src/constants.js";

test("DATA award tiers stay strictly ordered by threat", () => {
  const tiers = [
    SCORE_PACK,
    SCORE_STOMP,
    SCORE_TURRET,
    SCORE_ARMORED,
    SCORE_REX,
    SCORE_MINIBOSS,
    SCORE_REX_BOSS,
  ];
  for (let i = 1; i < tiers.length; i++) {
    assert.ok(
      tiers[i] > tiers[i - 1],
      `tier ${i} (${tiers[i]}) must exceed prior (${tiers[i - 1]})`
    );
  }
  assert.equal(SCORE_PACK, 10);
  assert.equal(SCORE_REX_BOSS, 200);
});
