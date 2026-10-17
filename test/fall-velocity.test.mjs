import { test } from "node:test";
import assert from "node:assert/strict";
import { GRAVITY, MAX_FALL, WALL_SLIDE_SPEED } from "../src/constants.js";
import { nextFallVelocity } from "../src/physics.js";

test("nextFallVelocity skips gravity while a dash is active", () => {
  assert.equal(
    nextFallVelocity(-100, 1 / 60, { dashTimer: 0.1, wallCling: 0, wallDir: 0 }),
    -100,
    "dash must not reintroduce fall"
  );
});

test("nextFallVelocity applies gravity and clamps to MAX_FALL", () => {
  const dt = 1 / 60;
  const stepped = nextFallVelocity(0, dt, {
    dashTimer: 0,
    wallCling: 0,
    wallDir: 0,
  });
  assert.ok(stepped > 0 && stepped < MAX_FALL);
  assert.ok(Math.abs(stepped - GRAVITY * dt) < 1e-6);

  const capped = nextFallVelocity(MAX_FALL - 1, 1, {
    dashTimer: 0,
    wallCling: 0,
    wallDir: 0,
  });
  assert.equal(capped, MAX_FALL);
});

test("nextFallVelocity caps downward speed while wall clinging", () => {
  const fast = nextFallVelocity(800, 0, {
    dashTimer: 0,
    wallCling: 0.1,
    wallDir: 1,
  });
  assert.equal(fast, WALL_SLIDE_SPEED);

  const rising = nextFallVelocity(-200, 0, {
    dashTimer: 0,
    wallCling: 0.1,
    wallDir: 1,
  });
  assert.equal(rising, -200, "upward motion is not wall-slide capped");
});
