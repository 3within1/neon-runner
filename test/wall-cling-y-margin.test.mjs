import { test } from "node:test";
import assert from "node:assert/strict";
import { rect, wallClingDir } from "../src/physics.js";

// Cling requires vertical overlap with a 4px inset on the wall face so toe /
// head grazes do not latch. Losing that margin makes corner-jumps sticky.

test("wallClingDir ignores holds that only graze the top or bottom of a wall", () => {
  const wall = rect(100, 0, 20, 200);
  // Player bottom just barely into the top 4px dead zone (overlapY false).
  const toeGraze = { x: 72, y: -36, w: 28, h: 40 }; // bottom at y=4
  assert.equal(wallClingDir(toeGraze, [wall], false, true), 0, "top 4px dead zone");

  // Fully overlapping mid-wall still latches.
  const mid = { x: 72, y: 80, w: 28, h: 40 };
  assert.equal(wallClingDir(mid, [wall], false, true), 1);

  // Head just into the bottom 4px dead zone (box.y >= p.y + p.h - 4).
  const headGraze = { x: 72, y: 196, w: 28, h: 40 }; // top at 196; wall bottom 200
  assert.equal(wallClingDir(headGraze, [wall], false, true), 0, "bottom 4px dead zone");
});

test("wallClingDir left-face latch uses the same Y margin", () => {
  const wall = rect(0, 0, 20, 200);
  const mid = { x: 20, y: 80, w: 28, h: 40 }; // left edge flush with wall right
  assert.equal(wallClingDir(mid, [wall], true, false), -1);
  const toeGraze = { x: 20, y: -36, w: 28, h: 40 };
  assert.equal(wallClingDir(toeGraze, [wall], true, false), 0);
});
