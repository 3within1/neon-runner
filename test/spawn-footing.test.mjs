import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import { buildLevel, getLevelCount, solidPlatforms } from "../src/level.js";
import { level } from "../src/state.js";

const PLAYER_W = 28;
const PLAYER_H = 40;

/** First solid pad under world X whose top is within maxDrop of feetY. */
function landingPad(atX, feetY, platforms, maxDrop = TILE * 3) {
  let best = null;
  for (const p of platforms) {
    if (p.fallen) continue;
    if (atX < p.x || atX > p.x + p.w) continue;
    if (p.y < feetY - 2) continue;
    if (p.y > feetY + maxDrop) continue;
    if (!best || p.y < best.y) best = p;
  }
  return best;
}

test("every campaign spawn has solid footing within a three-tile drop", () => {
  const n = getLevelCount();
  for (let i = 0; i < n; i++) {
    buildLevel(i);
    const midX = level.spawn.x + PLAYER_W * 0.5;
    const feetY = level.spawn.y + PLAYER_H;
    const pad = landingPad(midX, feetY, solidPlatforms());
    assert.ok(
      pad,
      `sector ${i} (${level.name}) spawn has no landing pad under x=${midX / TILE}`
    );
  }
});
