import { test } from "node:test";
import assert from "node:assert/strict";
import { SCORE_PACK } from "../src/constants.js";
import { compareEntries, formatRunBreakdown, normalizeInitials } from "../src/leaderboard.js";

function entry(overrides) {
  return {
    score: 0,
    outcome: "won",
    sector: 1,
    durationSec: 60,
    at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

test("compareEntries ranks higher DATA first", () => {
  const better = entry({ score: 500 });
  const worse = entry({ score: 100 });
  assert.ok(compareEntries(better, worse) < 0);
  assert.ok(compareEntries(worse, better) > 0);
});

test("compareEntries prefers a full clear over a crash at the same score", () => {
  const won = entry({ score: 200, outcome: "won" });
  const dead = entry({ score: 200, outcome: "dead" });
  assert.ok(compareEntries(won, dead) < 0);
  assert.ok(compareEntries(dead, won) > 0);
});

test("compareEntries breaks ties with higher sector", () => {
  const deeper = entry({ score: 300, sector: 5 });
  const shallower = entry({ score: 300, sector: 2 });
  assert.ok(compareEntries(deeper, shallower) < 0);
});

test("compareEntries breaks ties with faster duration", () => {
  const faster = entry({ score: 300, sector: 4, durationSec: 45 });
  const slower = entry({ score: 300, sector: 4, durationSec: 120 });
  assert.ok(compareEntries(faster, slower) < 0);
});

test("compareEntries treats non-positive duration as worse than a timed run", () => {
  const timed = entry({ score: 300, sector: 4, durationSec: 90 });
  const zero = entry({ score: 300, sector: 4, durationSec: 0 });
  const negative = entry({ score: 300, sector: 4, durationSec: -5 });
  assert.ok(compareEntries(timed, zero) < 0);
  assert.ok(compareEntries(timed, negative) < 0);
});

test("normalizeInitials strips, pads, and defaults", () => {
  assert.equal(normalizeInitials("ab"), "ABX");
  assert.equal(normalizeInitials("x!y@z"), "XYZ");
  assert.equal(normalizeInitials(""), "RUN");
  assert.equal(normalizeInitials("   "), "RUN");
  assert.equal(normalizeInitials("neon"), "NEO");
});

test("formatRunBreakdown reports pack/kill points and mode labels", () => {
  const base = {
    score: 250,
    coins: 10,
    stomps: 5,
    sectorIndex: 0,
    sectorTotal: 7,
    durationSec: 125,
    deaths: 1,
    maxCombo: 3,
  };
  const packPts = base.coins * SCORE_PACK;
  const killPts = Math.max(0, base.score - packPts);

  const run = formatRunBreakdown({ ...base, mode: "normal" });
  assert.match(run, /DATA 0250/);
  assert.match(run, new RegExp(`PACKS ${base.coins} \\(\\+${packPts}\\)`));
  assert.match(run, new RegExp(`KILLS ${base.stomps} \\(\\+${killPts}\\)`));
  assert.match(run, /SECTOR 01\/07/);
  assert.match(run, /TIME 2:05/);
  assert.match(run, /RUN$/);

  assert.match(formatRunBreakdown({ ...base, mode: "lockdown" }), /LOCKDOWN$/);
  assert.match(formatRunBreakdown({ ...base, mode: "timeAttack" }), /TRIAL$/);
});
