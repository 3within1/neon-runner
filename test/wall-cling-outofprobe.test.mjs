import { test } from "node:test";
import assert from "node:assert/strict";
import { rect, wallClingDir } from "../src/physics.js";

/**
 * Cling latches only while the held face sits in [wallFace - 1, wallFace + probe].
 * Past the probe (too deep into the solid) must not latch — otherwise tunneling
 * into a thick wall still grants cling/wall-jump.
 */
test("wallClingDir ignores a right face driven past the probe into the wall", () => {
  const wall = rect(100, 0, 40, 200);
  // Right edge at 109 → 9px into the wall; default probe is 8.
  const buried = { x: 81, y: 40, w: 28, h: 40 };
  assert.equal(wallClingDir(buried, [wall], false, true), 0);
  assert.equal(
    wallClingDir(buried, [wall], false, true, 10),
    1,
    "a deeper probe still accepts the same penetration"
  );
});

test("wallClingDir ignores a left face driven past the probe into the wall", () => {
  const wall = rect(0, 0, 40, 200);
  // Left edge at 11 → wall right is 40, so 29px into the solid from the face…
  // Face is at x=40; probe window is [40-probe, 40+1]. Buried left edge at 31
  // is 9px left of the face (into the wall).
  const buried = { x: 31, y: 40, w: 28, h: 40 };
  assert.equal(wallClingDir(buried, [wall], true, false), 0);
  assert.equal(wallClingDir(buried, [wall], true, false, 10), -1);
});
