import { test } from "node:test";
import assert from "node:assert/strict";
import { bossOffArenaPatrolVx } from "../src/physics.js";

test("bossOffArenaPatrolVx resumes baseSpeed when nearly stopped", () => {
  assert.equal(bossOffArenaPatrolVx(0, 80), 80);
  assert.equal(bossOffArenaPatrolVx(0.5, 120), 120);
  assert.equal(bossOffArenaPatrolVx(-0.9, 100), 100);
});

test("bossOffArenaPatrolVx preserves vx when |vx| >= 1", () => {
  assert.equal(bossOffArenaPatrolVx(1, 80), 1);
  assert.equal(bossOffArenaPatrolVx(-40, 80), -40);
  assert.equal(bossOffArenaPatrolVx(200, 80), 200);
});
