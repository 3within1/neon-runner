import { test } from "node:test";
import assert from "node:assert/strict";
import { canDetectWallCling } from "../src/physics.js";

test("canDetectWallCling requires unlock, airborne, and no active dash", () => {
  assert.equal(
    canDetectWallCling({ canWallCling: true, onGround: false, dashTimer: 0 }),
    true
  );
  assert.equal(
    canDetectWallCling({ canWallCling: false, onGround: false, dashTimer: 0 }),
    false,
    "ability lock clears cling"
  );
  assert.equal(
    canDetectWallCling({ canWallCling: true, onGround: true, dashTimer: 0 }),
    false,
    "grounded clears cling"
  );
  assert.equal(
    canDetectWallCling({ canWallCling: true, onGround: false, dashTimer: 0.01 }),
    false,
    "dash clears cling"
  );
});
