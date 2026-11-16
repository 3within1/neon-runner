import { test } from "node:test";
import assert from "node:assert/strict";
import { enemyBody } from "../src/level.js";

test("enemyBody ignores bob for grounded foes (turrets / bosses)", () => {
  const e = {
    x: 100,
    y: 200,
    w: 36,
    h: 36,
    grounded: true,
    bob: Math.PI / 2,
    bobAmp: 8,
    axis: "x",
  };
  assert.deepEqual(enemyBody(e), { x: 100, y: 200, w: 36, h: 36 });
});

test("enemyBody applies bob on the free axis for aerial drones", () => {
  const amp = 4;
  const bob = Math.PI / 2; // sin = 1
  const xDrone = {
    x: 50,
    y: 80,
    w: 36,
    h: 28,
    grounded: false,
    bob,
    bobAmp: amp,
    axis: "x",
  };
  assert.deepEqual(enemyBody(xDrone), {
    x: 50,
    y: 80 + amp,
    w: 36,
    h: 28,
  });

  const yClimber = {
    x: 50,
    y: 80,
    w: 28,
    h: 36,
    grounded: false,
    bob,
    bobAmp: amp,
    axis: "y",
  };
  assert.deepEqual(enemyBody(yClimber), {
    x: 50 + amp,
    y: 80,
    w: 28,
    h: 36,
  });
});
