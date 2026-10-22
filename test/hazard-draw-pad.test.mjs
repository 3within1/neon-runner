import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import { buildLevel, getLevelCount, getLevelDef } from "../src/level.js";
import { configureRunMode, level } from "../src/state.js";

/**
 * Hazard art pads outward from the hit rect so spikes/lasers read larger than
 * their collision box. Regressions here desync feel from isLaserHazardOn / hurt.
 */
test("built hazards keep draw padding relative to authored tiles", () => {
  configureRunMode("normal");
  const n = getLevelCount();
  let hazardCount = 0;

  for (let i = 0; i < n; i++) {
    const def = getLevelDef(i);
    if (!def.hazards?.length) continue;
    buildLevel(i);

    assert.equal(
      level.hazards.length,
      def.hazards.length,
      `sector ${i} hazard count matches def`
    );

    for (let h = 0; h < def.hazards.length; h++) {
      const [tx, ty, tw, th, kind = "spike"] = def.hazards[h];
      const hit = level.hazards[h];
      hazardCount += 1;

      assert.equal(hit.x, tx * TILE);
      assert.equal(hit.y, ty * TILE);
      assert.equal(hit.w, tw * TILE);
      assert.equal(hit.h, th * TILE);
      assert.equal(hit.kind, kind || "spike");

      assert.equal(hit.drawX, (tx - 0.15) * TILE);
      assert.equal(hit.drawY, (ty - 0.15) * TILE);
      assert.equal(hit.drawW, (tw + 0.3) * TILE);
      assert.equal(hit.drawH, (th + 0.15) * TILE);
    }
  }

  assert.ok(hazardCount >= 8, `expected many hazards, got ${hazardCount}`);
});
