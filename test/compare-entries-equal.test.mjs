import { test } from "node:test";
import assert from "node:assert/strict";
import { compareEntries } from "../src/leaderboard.js";

test("compareEntries returns zero for identical entries", () => {
  const entry = {
    score: 100,
    outcome: "won",
    sector: 3,
    durationSec: 60,
    at: "2026-01-01T00:00:00.000Z",
  };
  assert.equal(compareEntries(entry, { ...entry }), 0);
});

test("compareEntries uses timestamp when both durations are non-positive", () => {
  const earlier = {
    score: 200,
    outcome: "won",
    sector: 4,
    durationSec: 0,
    at: "2026-01-01T00:00:00.000Z",
  };
  const later = { ...earlier, at: "2026-06-01T00:00:00.000Z" };
  assert.ok(compareEntries(earlier, later) < 0, "earlier at wins when both lack a timed run");
  assert.ok(compareEntries(later, earlier) > 0);

  const bothNeg = { ...earlier, durationSec: -1 };
  const bothNegLater = { ...bothNeg, at: "2026-06-01T00:00:00.000Z" };
  assert.ok(compareEntries(bothNeg, bothNegLater) < 0);
});
