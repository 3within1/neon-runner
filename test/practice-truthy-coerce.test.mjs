import { test } from "node:test";
import assert from "node:assert/strict";
import { practiceMode, setPracticeMode } from "../src/state.js";

/**
 * Practice skips leaderboard / unlocks. Call sites may pass a truthy non-boolean
 * (e.g. from URL / opts); coercion must keep the skip gate reliable.
 */
test("setPracticeMode coerces truthy and falsy values", () => {
  setPracticeMode(1);
  assert.equal(practiceMode, true);

  setPracticeMode(0);
  assert.equal(practiceMode, false);

  setPracticeMode("yes");
  assert.equal(practiceMode, true);

  setPracticeMode("");
  assert.equal(practiceMode, false);

  setPracticeMode(null);
  assert.equal(practiceMode, false);
});
