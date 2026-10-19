import { test } from "node:test";
import assert from "node:assert/strict";
import { hazardCanHurtPlayer } from "../src/physics.js";

test("hazardCanHurtPlayer skips lasers while duty-cycled off", () => {
  assert.equal(hazardCanHurtPlayer({ kind: "laser", on: false }), false);
  assert.equal(hazardCanHurtPlayer({ kind: "laser", on: true }), true);
});

test("hazardCanHurtPlayer always allows electric and unknown kinds", () => {
  assert.equal(hazardCanHurtPlayer({ kind: "electric", on: true }), true);
  assert.equal(hazardCanHurtPlayer({ kind: "electric", on: false }), true);
  assert.equal(hazardCanHurtPlayer({ kind: "spike" }), true);
  assert.equal(hazardCanHurtPlayer({}), true, "missing kind still hurts");
});
