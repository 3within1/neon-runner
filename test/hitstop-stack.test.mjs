import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hitStop,
  setHitStop,
  tickHitStop,
} from "../src/state.js";

test("setHitStop keeps the longer remaining freeze (stomps stack by max)", () => {
  setHitStop(0);
  tickHitStop(1);
  assert.equal(hitStop, 0);

  setHitStop(0.05);
  assert.equal(hitStop, 0.05);

  setHitStop(0.14);
  assert.equal(hitStop, 0.14, "a heavier boss stomp extends the freeze");

  setHitStop(0.04);
  assert.equal(hitStop, 0.14, "a lighter follow-up does not shorten an active freeze");

  tickHitStop(0.06);
  assert.ok(Math.abs(hitStop - 0.08) < 1e-9);
  tickHitStop(0.2);
  assert.equal(hitStop, 0);
});
