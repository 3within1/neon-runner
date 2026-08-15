import { test } from "node:test";
import assert from "node:assert/strict";
import { bossPhaseFromHp, minibossPhaseFromHp } from "../src/level.js";

test("bossPhaseFromHp uses Cyber-Rex ratio thresholds", () => {
  assert.equal(bossPhaseFromHp(10, 10), 1);
  assert.equal(bossPhaseFromHp(6.3, 10), 1, "just above 0.62 stays phase 1");
  assert.equal(bossPhaseFromHp(6.2, 10), 2, "at 0.62 drops to phase 2");
  assert.equal(bossPhaseFromHp(2.9, 10), 2);
  assert.equal(bossPhaseFromHp(2.8, 10), 3, "at 0.28 drops to enraged");
  assert.equal(bossPhaseFromHp(1, 10), 3);
});

test("minibossPhaseFromHp uses absolute HP thresholds", () => {
  assert.equal(minibossPhaseFromHp(4), 1);
  assert.equal(minibossPhaseFromHp(3), 2);
  assert.equal(minibossPhaseFromHp(2), 3);
  assert.equal(minibossPhaseFromHp(1), 3);
});
