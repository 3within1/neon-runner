import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import { buildLevel, getLevelDef } from "../src/level.js";
import { configureRunMode, level } from "../src/state.js";

/** Mirror a tile-space AABB around the Ascender vertical centerline. */
function mirrorTile(tx, tw, widthTiles) {
  return widthTiles - tx - tw;
}

/**
 * Ascender teaches wall cling via mirrored shafts/ledges. Breaking the
 * symmetry leaves one side unclimbable and soft-locks the Tower Sentinel path.
 */
test("Ascender cling shafts, ledges, and spike wells stay mirrored", () => {
  configureRunMode("normal");
  const def = getLevelDef(1);
  assert.equal(def.id, "ascender");
  const W = def.width;

  const solids = def.platforms.filter((p) => p[4] !== "collapse");
  const shafts = solids.filter((p) => p[2] === 1 && p[3] >= 8);
  assert.equal(shafts.length, 2, "exactly two tall cling shafts");
  const [leftShaft, rightShaft] = [...shafts].sort((a, b) => a[0] - b[0]);
  assert.equal(mirrorTile(leftShaft[0], leftShaft[2], W), rightShaft[0]);
  assert.equal(leftShaft[1], rightShaft[1]);
  assert.equal(leftShaft[3], rightShaft[3]);

  // Every non-center solid pad must have a mirrored twin (center spine straddles mid).
  const mid = W / 2;
  for (const p of solids) {
    const [tx, ty, tw, th] = p;
    const centerX = tx + tw / 2;
    if (Math.abs(centerX - mid) < 0.01) continue; // center spine / summit
    const mx = mirrorTile(tx, tw, W);
    const twin = solids.find(
      (q) => q[0] === mx && q[1] === ty && q[2] === tw && q[3] === th
    );
    assert.ok(twin, `pad [${tx},${ty},${tw},${th}] needs mirror at tx=${mx}`);
  }

  buildLevel(1);
  const builtShafts = level.platforms.filter(
    (p) => p.kind === "solid" && Math.abs(p.w - TILE) < 0.5 && p.h >= TILE * 8
  );
  assert.equal(builtShafts.length, 2, "built level keeps two cling shafts");
  const [L, R] = [...builtShafts].sort((a, b) => a.x - b.x);
  assert.ok(Math.abs(L.x + L.w + R.x - level.width) < 0.5, "built shafts mirror in world space");
  assert.equal(L.y, R.y);
  assert.equal(L.h, R.h);

  const spikes = def.hazards.filter((h) => !h[4] || h[4] === "spike");
  assert.equal(spikes.length, 2, "mirrored spike wells under the shafts");
  const [sL, sR] = [...spikes].sort((a, b) => a[0] - b[0]);
  assert.ok(
    Math.abs(mirrorTile(sL[0], sL[2], W) - sR[0]) < 1e-9,
    `spike wells mirror: left tx=${sL[0]} right tx=${sR[0]}`
  );
  assert.equal(sL[1], sR[1]);
  assert.equal(sL[2], sR[2]);

  const climbers = level.enemies.filter((e) => e.type === "climber");
  assert.equal(climbers.length, 2, "climbers ride both shafts");
  const [cL, cR] = [...climbers].sort((a, b) => a.x - b.x);
  assert.ok(Math.abs(cL.x + cL.w + cR.x - level.width) < TILE, "climbers mirrored");
});
