import { test } from "node:test";
import assert from "node:assert/strict";
import { resolvePlayerAnim } from "../src/physics.js";

test("resolvePlayerAnim prioritizes dash over cling and airborne poses", () => {
  assert.equal(
    resolvePlayerAnim({
      dashTimer: 0.1,
      wallCling: 0.2,
      wallDir: 1,
      onGround: false,
      vy: -100,
      vx: 0,
    }),
    "run"
  );
});

test("resolvePlayerAnim uses cling only while airborne with a live wallDir", () => {
  assert.equal(
    resolvePlayerAnim({
      dashTimer: 0,
      wallCling: 0.15,
      wallDir: -1,
      onGround: false,
      vy: 50,
      vx: 0,
    }),
    "cling"
  );
  assert.equal(
    resolvePlayerAnim({
      dashTimer: 0,
      wallCling: 0.15,
      wallDir: 0,
      onGround: false,
      vy: 50,
      vx: 0,
    }),
    "fall",
    "wallDir 0 falls through to airborne"
  );
  assert.equal(
    resolvePlayerAnim({
      dashTimer: 0,
      wallCling: 0.15,
      wallDir: 1,
      onGround: true,
      vy: 0,
      vx: 0,
    }),
    "idle",
    "on-ground cling falls through to grounded poses"
  );
});

test("resolvePlayerAnim distinguishes jump, fall, run, and idle", () => {
  assert.equal(
    resolvePlayerAnim({
      dashTimer: 0,
      wallCling: 0,
      wallDir: 0,
      onGround: false,
      vy: -10,
      vx: 0,
    }),
    "jump"
  );
  assert.equal(
    resolvePlayerAnim({
      dashTimer: 0,
      wallCling: 0,
      wallDir: 0,
      onGround: false,
      vy: 10,
      vx: 0,
    }),
    "fall"
  );
  assert.equal(
    resolvePlayerAnim({
      dashTimer: 0,
      wallCling: 0,
      wallDir: 0,
      onGround: true,
      vy: 0,
      vx: 21,
    }),
    "run"
  );
  assert.equal(
    resolvePlayerAnim({
      dashTimer: 0,
      wallCling: 0,
      wallDir: 0,
      onGround: true,
      vy: 0,
      vx: 20,
    }),
    "idle",
    "run threshold is exclusive at 20"
  );
});
