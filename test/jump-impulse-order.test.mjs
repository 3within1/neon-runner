import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DOUBLE_JUMP_VELOCITY,
  JUMP_VELOCITY,
  STOMP_BOUNCE,
  WALL_JUMP_VY,
  WALL_SLIDE_SPEED,
  MAX_FALL,
} from "../src/constants.js";

test("jump impulses stay ordered: full jump > air jump > stomp bounce", () => {
  assert.ok(JUMP_VELOCITY < 0);
  assert.ok(DOUBLE_JUMP_VELOCITY < 0);
  assert.ok(STOMP_BOUNCE < 0);
  assert.ok(
    Math.abs(JUMP_VELOCITY) > Math.abs(DOUBLE_JUMP_VELOCITY),
    "air jump is weaker than the grounded jump"
  );
  assert.ok(
    Math.abs(DOUBLE_JUMP_VELOCITY) > Math.abs(STOMP_BOUNCE),
    "stomp bounce is weaker than air jump"
  );
  assert.ok(
    Math.abs(WALL_JUMP_VY) >= Math.abs(DOUBLE_JUMP_VELOCITY),
    "wall jump stays at least as strong as air jump"
  );
  assert.ok(WALL_SLIDE_SPEED > 0 && WALL_SLIDE_SPEED < MAX_FALL);
});
