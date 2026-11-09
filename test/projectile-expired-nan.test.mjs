import { test } from "node:test";
import assert from "node:assert/strict";
import { projectileExpired } from "../src/level.js";

test("projectileExpired treats NaN life as still live (life <= 0 is false for NaN)", () => {
  assert.equal(projectileExpired(Number.NaN), false, "NaN must not cull bolts");
  assert.equal(projectileExpired(0.01), false);
  assert.equal(projectileExpired(0), true);
  assert.equal(projectileExpired(-0.1), true);
});
