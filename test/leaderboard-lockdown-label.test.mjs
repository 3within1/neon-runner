import { test } from "node:test";
import assert from "node:assert/strict";
import { formatRunBreakdown } from "../src/leaderboard.js";

/**
 * Win/death summaries must label LOCKDOWN distinctly from normal RUN / TRIAL.
 * A silent fall-through to "RUN" misreports hard-mode clears on the board.
 */
test("formatRunBreakdown labels lockdown mode as LOCKDOWN", () => {
  const line = formatRunBreakdown({
    score: 1200,
    coins: 4,
    stomps: 6,
    sectorIndex: 6,
    sectorTotal: 7,
    durationSec: 95,
    outcome: "won",
    deaths: 2,
    maxCombo: 5,
    mode: "lockdown",
  });
  assert.match(line, /LOCKDOWN$/);
  assert.doesNotMatch(line, /· RUN$/);
  assert.doesNotMatch(line, /· TRIAL$/);
});
