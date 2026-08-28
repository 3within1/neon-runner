import { test } from "node:test";
import assert from "node:assert/strict";
import { applyPlayerRespawn } from "../src/state.js";
import { INVULN_HIT } from "../src/constants.js";

function makePlayer(overrides = {}) {
  return {
    x: 100,
    y: 200,
    prevX: 90,
    prevY: 190,
    vx: 120,
    vy: -400,
    facing: -1,
    onGround: true,
    coyote: 0.05,
    jumpBuffer: 0.08,
    airJumps: 0,
    maxAirJumps: 2,
    dashCd: 0.3,
    dashTimer: 0.1,
    wallDir: -1,
    wallCling: 0.2,
    anim: "run",
    frame: 3,
    frameTimer: 0.04,
    invuln: 0,
    jumpCutExempt: true,
    suppressLand: false,
    ...overrides,
  };
}

test("applyPlayerRespawn sets position from at and clears motion", () => {
  const p = makePlayer();
  applyPlayerRespawn(p, { x: 320, y: 144 });
  assert.equal(p.x, 320);
  assert.equal(p.y, 144);
  assert.equal(p.prevX, 320);
  assert.equal(p.prevY, 144);
  assert.equal(p.vx, 0);
  assert.equal(p.vy, 0);
});

test("applyPlayerRespawn clears abilities, timers, and sets invuln + suppressLand", () => {
  const p = makePlayer();
  applyPlayerRespawn(p, { x: 0, y: 0 });
  assert.equal(p.facing, 1);
  assert.equal(p.onGround, false);
  assert.equal(p.coyote, 0);
  assert.equal(p.jumpBuffer, 0);
  assert.equal(p.dashCd, 0);
  assert.equal(p.dashTimer, 0);
  assert.equal(p.wallDir, 0);
  assert.equal(p.wallCling, 0);
  assert.equal(p.anim, "idle");
  assert.equal(p.frame, 0);
  assert.equal(p.frameTimer, 0);
  assert.equal(p.invuln, INVULN_HIT);
  assert.equal(p.jumpCutExempt, false);
  assert.equal(p.suppressLand, true);
});

test("applyPlayerRespawn refills airJumps from maxAirJumps", () => {
  const p = makePlayer({ maxAirJumps: 1, airJumps: 0 });
  applyPlayerRespawn(p, { x: 10, y: 20 });
  assert.equal(p.airJumps, 1);
});
