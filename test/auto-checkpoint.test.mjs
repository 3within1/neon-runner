import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldAutoCheckpoint } from "../src/physics.js";

test("shouldAutoCheckpoint only when grounded and safe", () => {
  assert.equal(shouldAutoCheckpoint(true, true), true);
  assert.equal(shouldAutoCheckpoint(false, true), false, "airborne never auto-saves");
  assert.equal(shouldAutoCheckpoint(true, false), false, "unsafe pad never auto-saves");
  assert.equal(shouldAutoCheckpoint(false, false), false);
});
