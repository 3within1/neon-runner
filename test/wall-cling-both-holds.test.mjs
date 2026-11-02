import { test } from "node:test";
import assert from "node:assert/strict";
import { rect, wallClingDir } from "../src/physics.js";

/**
 * Input can report left+right together for a frame (dual-hold / lastDir fight).
 * Cling detection checks the right face first, then the left — so a flush right
 * wall with both holds must latch +1 deterministically (not flicker to 0/-1).
 */
test("wallClingDir prefers the right-face latch when both holds are true", () => {
  const rightWall = rect(100, 0, 20, 200);
  const flushRight = { x: 72, y: 40, w: 28, h: 40 }; // 72+28 === 100
  assert.equal(wallClingDir(flushRight, [rightWall], true, true), 1);

  const leftWall = rect(0, 0, 20, 200);
  const flushLeft = { x: 20, y: 40, w: 28, h: 40 }; // left edge === wall right
  assert.equal(
    wallClingDir(flushLeft, [leftWall], true, true),
    -1,
    "left face still latches when only a left wall is in range"
  );
});
