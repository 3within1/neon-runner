import { test } from "node:test";
import assert from "node:assert/strict";
import { isFallenIntoPit } from "../src/physics.js";

test("isFallenIntoPit kills only below the sector floor + 80px margin", () => {
  const height = 540;
  assert.equal(isFallenIntoPit(height + 80, height), false, "exact margin is still safe");
  assert.equal(isFallenIntoPit(height + 80.01, height), true);
  assert.equal(isFallenIntoPit(height, height), false, "still inside the sector");
  assert.equal(isFallenIntoPit(0, height), false);
});

test("isFallenIntoPit accepts an explicit kill-plane margin", () => {
  assert.equal(isFallenIntoPit(100, 100, 0), false);
  assert.equal(isFallenIntoPit(100.1, 100, 0), true);
});
