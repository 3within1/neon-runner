import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatCampaignWinBestSuffix,
  formatTimeTrialClearNote,
} from "../src/story.js";

test("formatTimeTrialClearNote marks a new sector best", () => {
  assert.equal(
    formatTimeTrialClearNote(75.5, true, 80),
    "Sector clear in 1:15.50. NEW BEST."
  );
});

test("formatTimeTrialClearNote shows prior best or placeholder", () => {
  assert.equal(
    formatTimeTrialClearNote(90, false, 75.5),
    "Sector clear in 1:30.00. Best 1:15.50."
  );
  assert.equal(
    formatTimeTrialClearNote(12, false, 0),
    "Sector clear in 0:12.00. Best --."
  );
});

test("formatCampaignWinBestSuffix uses em dash for new bests", () => {
  assert.equal(
    formatCampaignWinBestSuffix(125.25, true, null),
    " Clear 2:05.25 — NEW BEST."
  );
  assert.equal(
    formatCampaignWinBestSuffix(130, false, 125.25),
    " Clear 2:10.00. Best 2:05.25."
  );
});
