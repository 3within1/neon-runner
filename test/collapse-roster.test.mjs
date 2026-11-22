import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLevel, getLevelCount, getLevelDef } from "../src/level.js";
import { configureRunMode, level } from "../src/state.js";

/**
 * Collapse pads must ship with kind + timers initialized. A missing kind or
 * sticky fallen/fuse from a prior sector would turn them into permanent solids
 * or already-fallen holes after buildLevel.
 */
test("every collapse pad builds with fresh timers and kind=collapse", () => {
  configureRunMode("normal");
  const n = getLevelCount();
  let total = 0;

  for (let i = 0; i < n; i++) {
    const def = getLevelDef(i);
    const expected = def.platforms.filter((p) => p[4] === "collapse").length;
    buildLevel(i);
    const collapses = level.platforms.filter((p) => p.kind === "collapse");
    assert.equal(
      collapses.length,
      expected,
      `sector ${i} (${level.name}) collapse count matches def`
    );
    for (const p of collapses) {
      assert.equal(p.fallen, false);
      assert.equal(p.collapseTimer, 0);
      assert.equal(p.respawnTimer, 0);
      assert.equal(p.shake, 0);
    }
    total += collapses.length;
  }

  assert.ok(total >= 4, "campaign still ships multiple collapse pads");
});
