import { test } from "node:test";
import assert from "node:assert/strict";
import { WALL_CLING_GRACE } from "../src/constants.js";
import { tickWallClingGrace } from "../src/state.js";

test("tickWallClingGrace refreshes on contact", () => {
  const next = tickWallClingGrace(0.01, 0, 1, 1 / 60);
  assert.equal(next.wallDir, 1);
  assert.equal(next.wallCling, WALL_CLING_GRACE);
});

test("tickWallClingGrace decays then clears direction after grace expires", () => {
  const mid = tickWallClingGrace(WALL_CLING_GRACE, -1, 0, 0.05);
  assert.equal(mid.wallDir, -1, "keeps last wall while grace remains");
  assert.ok(mid.wallCling > 0 && mid.wallCling < WALL_CLING_GRACE);

  const done = tickWallClingGrace(0.02, -1, 0, 0.05);
  assert.equal(done.wallCling, 0);
  assert.equal(done.wallDir, 0, "clears dir once grace hits zero");
});
