import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SCORE_PACK,
  SCORE_STOMP,
  SCORE_TURRET,
  SCORE_ARMORED,
} from "../src/constants.js";
import { formatRunBreakdown } from "../src/leaderboard.js";

/**
 * End-of-run breakdown attributes leftover DATA after pack points to KILLS.
 * If SCORE_PACK drifts or the residual clamp regresses, the HUD lies about
 * combat vs pickup earnings.
 */
test("formatRunBreakdown kill points equal score minus pack awards", () => {
  const coins = 4;
  const stomps = 3;
  const turrets = 1;
  const armored = 1;
  const killPts =
    stomps * SCORE_STOMP + turrets * SCORE_TURRET + armored * SCORE_ARMORED;
  const packPts = coins * SCORE_PACK;
  const score = packPts + killPts;

  const line = formatRunBreakdown({
    score,
    coins,
    stomps: stomps + turrets + armored,
    sectorIndex: 3,
    sectorTotal: 7,
    durationSec: 90,
    mode: "normal",
  });

  assert.match(line, new RegExp(`PACKS ${coins} \\(\\+${packPts}\\)`));
  assert.match(
    line,
    new RegExp(`KILLS ${stomps + turrets + armored} \\(\\+${killPts}\\)`)
  );
  assert.equal(SCORE_PACK, 10);
  assert.equal(SCORE_STOMP, 20);
  assert.equal(SCORE_TURRET, 30);
  assert.equal(SCORE_ARMORED, 40);
});

test("formatRunBreakdown clamps kill points at zero when packs exceed score", () => {
  // Combo bonuses / lockdown mult quirks can leave score below packPts.
  const line = formatRunBreakdown({
    score: 5,
    coins: 2,
    stomps: 0,
    sectorIndex: 0,
    sectorTotal: 7,
    durationSec: 1,
  });
  assert.match(line, /PACKS 2 \(\+20\)/);
  assert.match(line, /KILLS 0 \(\+0\)/, "never renders a negative kill residual");
});
