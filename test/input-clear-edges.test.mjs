import { test } from "node:test";
import assert from "node:assert/strict";
import { clearInput, getLastDir, input } from "../src/input.js";

// clearInput must wipe edge-triggered flags so a held menu press does not
// fire jump/dash/pause on the first frame after returning to play.

test("clearInput resets held axes and one-shot edge flags", () => {
  input.left = true;
  input.right = true;
  input.jump = true;
  input.dash = true;
  input.jumpPressed = true;
  input.jumpReleased = true;
  input.dashPressed = true;
  input.pausePressed = true;

  clearInput();

  assert.equal(input.left, false);
  assert.equal(input.right, false);
  assert.equal(input.jump, false);
  assert.equal(input.dash, false);
  assert.equal(input.jumpPressed, false);
  assert.equal(input.jumpReleased, false);
  assert.equal(input.dashPressed, false);
  assert.equal(input.pausePressed, false);
});

test("clearInput leaves facing memory intact", () => {
  // Default lastDir is "right"; clear must not invent a facing flip mid-run.
  assert.equal(getLastDir(), "right");
  clearInput();
  assert.equal(getLastDir(), "right");
});
