import { test } from "node:test";
import assert from "node:assert/strict";
import { clearInput, getLastDir } from "../src/input.js";

// Dash / facing fall back to lastDir when both left+right are held. Blur /
// visibilitychange call clearInput — facing memory must survive that wipe so
// the next dash still aims the way the runner was facing.

test("getLastDir defaults to right and survives clearInput", () => {
  assert.equal(getLastDir(), "right", "boot facing is right");
  clearInput();
  assert.equal(getLastDir(), "right", "clearInput must not reset facing memory");
});
