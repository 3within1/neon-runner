import { test } from "node:test";
import assert from "node:assert/strict";
import { refillAirJumps } from "../src/physics.js";

test("refillAirJumps restores the sector max while grounded", () => {
  assert.equal(refillAirJumps(true, 1, 0), 1);
  assert.equal(refillAirJumps(true, 1, 1), 1);
  assert.equal(refillAirJumps(true, 0, 0), 0, "pre-unlock sectors stay at 0");
});

test("refillAirJumps leaves the airborne count unchanged", () => {
  assert.equal(refillAirJumps(false, 1, 0), 0, "spent double-jump stays spent");
  assert.equal(refillAirJumps(false, 1, 1), 1, "unused air jump preserved mid-air");
  assert.equal(refillAirJumps(false, 2, 1), 1, "does not top up while airborne");
});
