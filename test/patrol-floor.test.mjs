import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLevel, getLevelCount } from "../src/level.js";
import { configureRunMode, level } from "../src/state.js";

/** Supporting pad under mid-X near feet, matching spawn snap tolerance. */
function platformUnder(midX, feetY) {
  let best = null;
  for (const p of level.platforms) {
    if (p.fallen) continue;
    if (midX < p.x || midX > p.x + p.w) continue;
    if (Math.abs(p.y - feetY) > 4) continue;
    if (!best || p.w > best.w) best = p;
  }
  return best;
}

/**
 * Grounded X patrols must keep floor under their full [minX, maxX] span.
 * buildLevel already asserts this; pin it in a dedicated Node test so a lip
 * clamp regression fails with a clear sector/type message in CI.
 */
test("grounded X enemies keep floor under min, mid, and max patrol samples", () => {
  configureRunMode("lockdown");
  const n = getLevelCount();

  for (let i = 0; i < n; i++) {
    buildLevel(i);
    for (const e of level.enemies) {
      if (!e.grounded || e.axis !== "x" || !e.alive) continue;
      const feetY = e.y + e.h;
      const samples = [e.minX + 2, e.x + e.w * 0.5, e.maxX - 2];
      for (const x of samples) {
        const mid = Math.max(e.minX, Math.min(e.maxX, x));
        assert.ok(
          platformUnder(mid, feetY),
          `sector ${i} (${level.name}) ${e.type} loses floor at x=${mid}`
        );
      }
    }
  }
});
