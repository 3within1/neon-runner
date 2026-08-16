import { test } from "node:test";
import assert from "node:assert/strict";
import { JUMP_CUT_FACTOR, JUMP_CUT_THRESHOLD } from "../src/constants.js";
import { applyJumpCut } from "../src/physics.js";

test("applyJumpCut shortens ascent when past the threshold", () => {
  const rising = JUMP_CUT_THRESHOLD - 40;
  assert.equal(applyJumpCut(rising, false), rising * JUMP_CUT_FACTOR);
});

test("applyJumpCut leaves slow ascent and descent alone", () => {
  assert.equal(applyJumpCut(JUMP_CUT_THRESHOLD, false), JUMP_CUT_THRESHOLD);
  assert.equal(applyJumpCut(JUMP_CUT_THRESHOLD + 10, false), JUMP_CUT_THRESHOLD + 10);
  assert.equal(applyJumpCut(200, false), 200);
});

test("applyJumpCut respects stomp/wall-jump exemption", () => {
  const rising = JUMP_CUT_THRESHOLD - 100;
  assert.equal(applyJumpCut(rising, true), rising);
});
