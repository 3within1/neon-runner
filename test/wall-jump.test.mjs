import { test } from "node:test";
import assert from "node:assert/strict";
import {
  WALL_JUMP_VX,
  WALL_JUMP_VY,
  WALL_SLIDE_SPEED,
} from "../src/constants.js";
import { capWallSlideFall, wallJumpVelocity } from "../src/physics.js";

test("wallJumpVelocity kicks away from the clung wall", () => {
  assert.deepEqual(wallJumpVelocity(1), {
    vx: -WALL_JUMP_VX,
    vy: WALL_JUMP_VY,
    facing: -1,
  });
  assert.deepEqual(wallJumpVelocity(-1), {
    vx: WALL_JUMP_VX,
    vy: WALL_JUMP_VY,
    facing: 1,
  });
});

test("capWallSlideFall only limits downward speed while clinging", () => {
  assert.equal(capWallSlideFall(800, 0.14, 1), WALL_SLIDE_SPEED);
  assert.equal(capWallSlideFall(800, 0.14, -1), WALL_SLIDE_SPEED);
  assert.equal(capWallSlideFall(50, 0.14, 1), 50, "already slower than slide cap");
  assert.equal(capWallSlideFall(-400, 0.14, 1), -400, "upward motion untouched");
  assert.equal(capWallSlideFall(800, 0, 1), 800, "no cling → no cap");
  assert.equal(capWallSlideFall(800, 0.14, 0), 800, "no wallDir → no cap");
});
