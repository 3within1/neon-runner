import { test } from "node:test";
import assert from "node:assert/strict";
import { stepPatrol1D } from "../src/level.js";

test("stepPatrol1D advances within bounds without flipping", () => {
  const mid = stepPatrol1D(100, 40, 80, 0, 400, 80, 0.1);
  assert.equal(mid.pos, 108);
  assert.equal(mid.vel, 80);
});

test("stepPatrol1D bounces at the low bound toward +speed", () => {
  const hit = stepPatrol1D(5, 40, -80, 0, 400, 80, 0.1);
  assert.equal(hit.pos, 0);
  assert.equal(hit.vel, 80);
});

test("stepPatrol1D bounces at the high bound toward -speed", () => {
  const hit = stepPatrol1D(370, 40, 80, 0, 400, 80, 0.1);
  assert.equal(hit.pos, 360);
  assert.equal(hit.vel, -80);
});
