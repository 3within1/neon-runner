import { test } from "node:test";
import assert from "node:assert/strict";
import { WALL_CLING_GRACE } from "../src/constants.js";
import { tickWallClingGrace } from "../src/state.js";

test("tickWallClingGrace refreshes grace when cling side swaps mid-air", () => {
  const swapped = tickWallClingGrace(0.05, -1, 1, 1 / 60);
  assert.equal(swapped.wallDir, 1, "detected side wins immediately");
  assert.equal(swapped.wallCling, WALL_CLING_GRACE, "side swap fully refreshes grace");
});
