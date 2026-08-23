import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldPlayLandSfx } from "../src/physics.js";

test("shouldPlayLandSfx fires only on the grounded falling transition", () => {
  assert.equal(
    shouldPlayLandSfx({ wasGrounded: false, falling: true, suppressLand: false }),
    true
  );
  assert.equal(
    shouldPlayLandSfx({ wasGrounded: true, falling: true, suppressLand: false }),
    false,
    "already grounded — no land SFX"
  );
  assert.equal(
    shouldPlayLandSfx({ wasGrounded: false, falling: false, suppressLand: false }),
    false,
    "rising / soft touch — no land SFX"
  );
});

test("shouldPlayLandSfx respects suppressLand (checkpoint / forced respawn)", () => {
  assert.equal(
    shouldPlayLandSfx({ wasGrounded: false, falling: true, suppressLand: true }),
    false
  );
});
