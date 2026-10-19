import { test } from "node:test";
import assert from "node:assert/strict";
import { canWallJump } from "../src/physics.js";

test("canWallJump requires cling grace, a wall face, and airborne feet", () => {
  assert.equal(
    canWallJump({ wallCling: 0.14, wallDir: 1, onGround: false }),
    true
  );
  assert.equal(
    canWallJump({ wallCling: 0.14, wallDir: -1, onGround: false }),
    true
  );
  assert.equal(
    canWallJump({ wallCling: 0, wallDir: 1, onGround: false }),
    false,
    "expired cling grace blocks wall jump"
  );
  assert.equal(
    canWallJump({ wallCling: 0.14, wallDir: 0, onGround: false }),
    false,
    "unknown wall face blocks wall jump"
  );
  assert.equal(
    canWallJump({ wallCling: 0.14, wallDir: 1, onGround: true }),
    false,
    "grounded frames cannot wall jump"
  );
});
