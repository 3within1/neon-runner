import { test } from "node:test";
import assert from "node:assert/strict";
import { formatRunBreakdown } from "../src/leaderboard.js";

test("formatRunBreakdown defaults omitted deaths/combo and unknown mode to RUN", () => {
  const line = formatRunBreakdown({
    score: 42,
    coins: 1,
    stomps: 0,
    sectorIndex: 2,
    sectorTotal: 7,
    durationSec: 9,
  });
  assert.match(line, /DATA 0042/);
  assert.match(line, /PACKS 1 \(\+10\)/);
  assert.match(line, /KILLS 0 \(\+32\)/);
  assert.match(line, /SECTOR 03\/07/);
  assert.match(line, /TIME 0:09/);
  assert.match(line, /DEATHS 0 · COMBO 0 · RUN$/);
});
