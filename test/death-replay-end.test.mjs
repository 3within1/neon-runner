import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hitStop,
  nextHitStop,
  setHitStop,
  shouldFinishDeathReplay,
  tickHitStop,
} from "../src/state.js";

test("shouldFinishDeathReplay trips at the default 2s presentation window", () => {
  assert.equal(shouldFinishDeathReplay(0), false);
  assert.equal(shouldFinishDeathReplay(1.99), false);
  assert.equal(shouldFinishDeathReplay(2), true);
  assert.equal(shouldFinishDeathReplay(2.5), true);
  assert.equal(shouldFinishDeathReplay(1.5, 1.5), true, "custom duration inclusive");
  assert.equal(shouldFinishDeathReplay(1.49, 1.5), false);
});

test("nextHitStop / setHitStop never shorten a longer freeze", () => {
  assert.equal(nextHitStop(0.05, 0.14), 0.14);
  assert.equal(nextHitStop(0.2, 0.05), 0.2);

  tickHitStop(hitStop + 1); // zero any leftover from other imports
  setHitStop(0.05);
  setHitStop(0.14);
  assert.equal(hitStop, 0.14);
  setHitStop(0.05);
  assert.equal(hitStop, 0.14, "weaker chip must not override boss freeze");
  tickHitStop(hitStop + 1);
});
