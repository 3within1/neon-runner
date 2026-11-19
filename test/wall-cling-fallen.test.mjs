import { test } from "node:test";
import assert from "node:assert/strict";
import { rect, wallClingDir } from "../src/physics.js";

/**
 * Collapse pads that have fallen must not remain clingable walls. wallClingDir
 * walks the same solid list as resolveAxis; a fallen flag skip here prevents
 * mid-air cling on a missing tile.
 */
test("wallClingDir ignores fallen platforms on both faces", () => {
  const rightWall = rect(100, 0, 20, 200);
  const leftWall = rect(0, 0, 20, 200);
  const flushRight = { x: 72, y: 40, w: 28, h: 40 }; // 72+28 === 100
  const flushLeft = { x: 20, y: 40, w: 28, h: 40 }; // 20 === 0+20

  assert.equal(wallClingDir(flushRight, [rightWall], false, true), 1);
  assert.equal(
    wallClingDir(flushRight, [{ ...rightWall, fallen: true }], false, true),
    0,
    "fallen right wall is not clingable"
  );

  assert.equal(wallClingDir(flushLeft, [leftWall], true, false), -1);
  assert.equal(
    wallClingDir(flushLeft, [{ ...leftWall, fallen: true }], true, false),
    0,
    "fallen left wall is not clingable"
  );
});

test("wallClingDir still finds a live wall beside a fallen neighbor", () => {
  const fallen = { ...rect(100, 0, 20, 200), fallen: true };
  const live = rect(200, 0, 20, 200);
  const box = { x: 172, y: 40, w: 28, h: 40 }; // flush with live at x=200
  assert.equal(wallClingDir(box, [fallen, live], false, true), 1);
});
