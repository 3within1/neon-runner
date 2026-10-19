import { test } from "node:test";
import assert from "node:assert/strict";
import { checkpointTouchResult } from "../src/level.js";

const pad = { x: 100, y: 200, w: 48, h: 48, activated: false };
const player = { x: 110, y: 210, w: 28, h: 40 };

test("activated pad returns null", () => {
  assert.equal(checkpointTouchResult(player, { ...pad, activated: true }, 40), null);
});

test("no AABB overlap returns null", () => {
  const far = { x: 0, y: 0, w: 28, h: 40 };
  assert.equal(checkpointTouchResult(far, pad, 40), null);
});

test("overlap returns spawn offset and invulnBoost 0.45", () => {
  const result = checkpointTouchResult(player, pad, 40);
  assert.notEqual(result, null);
  assert.equal(result.spawn.x, pad.x + 8);
  assert.equal(result.spawn.y, pad.y - 40);
  assert.equal(result.invulnBoost, 0.45);
});

test("playerH affects spawn.y", () => {
  const short = checkpointTouchResult(player, pad, 30);
  const tall = checkpointTouchResult(player, pad, 50);
  assert.equal(short.spawn.y, pad.y - 30);
  assert.equal(tall.spawn.y, pad.y - 50);
  assert.ok(tall.spawn.y < short.spawn.y);
});
