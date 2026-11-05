import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addRunElapsed,
  resetRunStats,
  resetSectorElapsed,
  runElapsed,
  sectorElapsed,
} from "../src/state.js";

test("addRunElapsed advances both run and sector clocks together", () => {
  resetRunStats();
  assert.equal(runElapsed, 0);
  assert.equal(sectorElapsed, 0);

  addRunElapsed(0.5);
  assert.equal(runElapsed, 0.5);
  assert.equal(sectorElapsed, 0.5);

  addRunElapsed(1.25);
  assert.equal(runElapsed, 1.75);
  assert.equal(sectorElapsed, 1.75);
});

test("resetSectorElapsed clears only the sector clock", () => {
  resetRunStats();
  addRunElapsed(3);
  resetSectorElapsed();
  assert.equal(sectorElapsed, 0, "sector timer restarts at a sector gate");
  assert.equal(runElapsed, 3, "full-run timer keeps accumulating");
});
