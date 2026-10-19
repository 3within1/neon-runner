import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import { buildLevel, getLevelCount, solidPlatforms } from "../src/level.js";
import { level } from "../src/state.js";

const PLAYER_W = 28;

/**
 * Checkpoint activation parks the runner at (pad.x + 8, pad.y - playerH),
 * so feet land at pad.y. There must be a solid top near that Y under the
 * respawn mid-X — otherwise a mid-run death soft-locks into a pit.
 */
function landingPad(atX, feetY, platforms, maxDrop = TILE * 1.5) {
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

test("every campaign checkpoint respawns onto solid footing", () => {
  const n = getLevelCount();
  for (let i = 0; i < n; i++) {
    buildLevel(i);
    const platforms = solidPlatforms();
    assert.ok(
      level.checkpoints.length > 0,
      `sector ${i} (${level.name}) should expose at least one checkpoint`
    );
    for (const c of level.checkpoints) {
      const midX = c.x + 8 + PLAYER_W * 0.5;
      const feetY = c.y;
      const pad = landingPad(midX, feetY, platforms);
      assert.ok(
        pad,
        `sector ${i} checkpoint at (${c.x / TILE}, ${c.y / TILE}) has no landing pad`
      );
    }
  }
});
