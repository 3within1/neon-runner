import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addRunElapsed,
  resetRunStats,
  resetSectorElapsed,
  runElapsed,
  sectorElapsed,
} from "../src/state.js";

// Time-trial / sector HUD clocks must diverge from the full-run clock when a
// sector clears. A regression that resets both (or neither) corrupts clears.

test("addRunElapsed advances both run and sector clocks together", () => {
  resetRunStats();
  assert.equal(runElapsed, 0);
  assert.equal(sectorElapsed, 0);

  addRunElapsed(1.5);
  assert.equal(runElapsed, 1.5);
  assert.equal(sectorElapsed, 1.5);
});

test("resetSectorElapsed clears only the sector clock", () => {
  resetRunStats();
  addRunElapsed(2.25);
  resetSectorElapsed();

  assert.equal(sectorElapsed, 0, "sector clock restarts at sector boundary");
  assert.equal(runElapsed, 2.25, "full-run clock must survive sector reset");

  addRunElapsed(0.5);
  assert.equal(runElapsed, 2.75);
  assert.equal(sectorElapsed, 0.5);
});

test("resetRunStats zeroes both elapsed clocks", () => {
  addRunElapsed(9);
  resetRunStats();
  assert.equal(runElapsed, 0);
  assert.equal(sectorElapsed, 0);
});
