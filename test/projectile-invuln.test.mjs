import { test } from "node:test";
import assert from "node:assert/strict";
import {
  advanceProjectile,
  projectileCanHurtPlayer,
  projectileExpired,
} from "../src/level.js";

test("advanceProjectile moves by velocity*dt and drains life", () => {
  const next = advanceProjectile({ x: 10, y: 20, vx: 100, vy: -50, life: 2.6 }, 0.1);
  assert.equal(next.x, 20);
  assert.equal(next.y, 15);
  assert.equal(next.life, 2.5);
});

test("projectileExpired gates bolt removal", () => {
  assert.equal(projectileExpired(0.01), false);
  assert.equal(projectileExpired(0), true);
  assert.equal(projectileExpired(-0.1), true);
});

test("projectileCanHurtPlayer is false while invulnerable (bolts pass through)", () => {
  assert.equal(projectileCanHurtPlayer(0), true);
  assert.equal(projectileCanHurtPlayer(0.01), false);
  assert.equal(projectileCanHurtPlayer(Infinity), false);
});
