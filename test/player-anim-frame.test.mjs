import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PLAYER_ANIM_PERIODS,
  stepPlayerAnimFrame,
} from "../src/physics.js";

test("stepPlayerAnimFrame advances on period overrun and wraps at 4", () => {
  const idlePeriod = PLAYER_ANIM_PERIODS.idle;
  const mid = stepPlayerAnimFrame(idlePeriod * 0.5, 0, "idle", idlePeriod * 0.4);
  assert.equal(mid.frame, 0, "stays on frame while under period");
  assert.ok(mid.frameTimer > 0);

  const tick = stepPlayerAnimFrame(idlePeriod, 0, "idle", 0.001);
  assert.equal(tick.frameTimer, 0, "timer resets after overrun");
  assert.equal(tick.frame, 1);

  const wrap = stepPlayerAnimFrame(PLAYER_ANIM_PERIODS.run, 3, "run", 0.001);
  assert.equal(wrap.frame, 0, "4-frame sheet wraps");
});

test("stepPlayerAnimFrame uses a default period for unknown poses", () => {
  const unknown = stepPlayerAnimFrame(0.12, 1, "unknown-pose", 0.001);
  assert.equal(unknown.frameTimer, 0);
  assert.equal(unknown.frame, 2);
});
