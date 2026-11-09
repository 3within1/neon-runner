import { test } from "node:test";
import assert from "node:assert/strict";
import { WALL_JUMP_VY } from "../src/constants.js";
import { wallJumpVelocity } from "../src/physics.js";

/**
 * tryWallJump gates on wallDir !== 0, but the impulse helper itself must stay
 * deterministic if called with 0 (no kick, facing 0). A future refactor that
 * drops the gate would otherwise launch a facing-0 dash/sprite glitch.
 */
test("wallJumpVelocity with wallDir 0 yields no horizontal kick", () => {
  const impulse = wallJumpVelocity(0);
  // `-0 * N` yields signed -0; `=== 0` still holds (unlike Object.is / strictEqual).
  assert.ok(impulse.vx === 0);
  assert.ok(impulse.facing === 0);
  assert.equal(impulse.vy, WALL_JUMP_VY);
});
