import { test } from "node:test";
import assert from "node:assert/strict";
import { rect, wallClingDir } from "../src/physics.js";

test("wallClingDir detects a flush left-wall hold", () => {
  const wall = rect(0, 0, 20, 200);
  const flush = { x: 20, y: 40, w: 28, h: 40 }; // left edge === wall right
  assert.equal(wallClingDir(flush, [wall], true, false), -1);
  assert.equal(wallClingDir(flush, [wall], false, true), 0, "holding the wrong way");
});

test("wallClingDir accepts a 1px hairline gap from float rounding", () => {
  const wall = rect(100, 0, 20, 200);
  // Right edge sits 1px short of the wall face (flush would be x+w === 100).
  const hairline = { x: 71, y: 40, w: 28, h: 40 }; // 71+28 === 99
  assert.equal(wallClingDir(hairline, [wall], false, true), 1);

  const leftWall = rect(0, 0, 20, 200);
  const leftHairline = { x: 21, y: 40, w: 28, h: 40 }; // left edge 1px past flush
  assert.equal(wallClingDir(leftHairline, [leftWall], true, false), -1);
});

test("wallClingDir ignores fallen platforms and weak Y overlap", () => {
  const wall = rect(100, 0, 20, 200);
  const flush = { x: 72, y: 40, w: 28, h: 40 };
  assert.equal(wallClingDir(flush, [{ ...wall, fallen: true }], false, true), 0);

  // Barely above the wall — bottom never clears the +4px Y margin.
  const skim = { x: 72, y: -37, w: 28, h: 40 }; // bottom at y=3 ≤ wall.y+4
  assert.equal(wallClingDir(skim, [wall], false, true), 0);
});
