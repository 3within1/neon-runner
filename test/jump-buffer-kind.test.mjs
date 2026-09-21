import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveBufferedJumpKind } from "../src/physics.js";

test("wall wins when clinging off ground", () => {
  assert.equal(
    resolveBufferedJumpKind({
      wallCling: 0.1,
      wallDir: 1,
      onGround: false,
      coyote: 0,
      airJumps: 1,
    }),
    "wall"
  );
});

test("wall blocked on ground falls through to coyote", () => {
  assert.equal(
    resolveBufferedJumpKind({
      wallCling: 0.1,
      wallDir: 1,
      onGround: true,
      coyote: 0.5,
      airJumps: 1,
    }),
    "coyote"
  );
});

test("coyote when no wall cling", () => {
  assert.equal(
    resolveBufferedJumpKind({
      wallCling: 0,
      wallDir: 0,
      onGround: false,
      coyote: 0.1,
      airJumps: 1,
    }),
    "coyote"
  );
});

test("air when coyote exhausted", () => {
  assert.equal(
    resolveBufferedJumpKind({
      wallCling: 0,
      wallDir: 0,
      onGround: false,
      coyote: 0,
      airJumps: 1,
    }),
    "air"
  );
});

test("null when no jump available", () => {
  assert.equal(
    resolveBufferedJumpKind({
      wallCling: 0,
      wallDir: 0,
      onGround: false,
      coyote: 0,
      airJumps: 0,
    }),
    null
  );
});

test("wallDir 0 skips wall and uses air", () => {
  assert.equal(
    resolveBufferedJumpKind({
      wallCling: 0.1,
      wallDir: 0,
      onGround: false,
      coyote: 0,
      airJumps: 1,
    }),
    "air"
  );
});
