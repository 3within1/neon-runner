import { test } from "node:test";
import assert from "node:assert/strict";
import { compareEntries, formatRunBreakdown } from "../src/leaderboard.js";

function entry(overrides) {
  return {
    score: 100,
    outcome: "won",
    sector: 3,
    durationSec: 60,
    at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

test("compareEntries breaks remaining ties with earlier timestamp", () => {
  const earlier = entry({ at: "2026-01-01T00:00:00.000Z" });
  const later = entry({ at: "2026-06-01T00:00:00.000Z" });
  assert.ok(compareEntries(earlier, later) < 0, "earlier ISO timestamp ranks first");
  assert.ok(compareEntries(later, earlier) > 0);
});

test("formatRunBreakdown includes deaths and max combo", () => {
  const line = formatRunBreakdown({
    score: 100,
    coins: 2,
    stomps: 1,
    sectorIndex: 1,
    sectorTotal: 7,
    durationSec: 65,
    deaths: 2,
    maxCombo: 5,
    mode: "normal",
  });
  assert.match(line, /DEATHS 2/);
  assert.match(line, /COMBO 5/);
  assert.match(line, /RUN$/);
});
