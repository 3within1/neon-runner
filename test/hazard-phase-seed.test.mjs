import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import { buildLevel, getLevelCount, getLevelDef } from "../src/level.js";
import { configureRunMode, level } from "../src/state.js";

/**
 * Laser/electric phase is seeded from tile coords so hazards do not blink in
 * lockstep. A constant or zero phase would make whole corridors pulse as one.
 */
test("hazard phase is seeded from tile position (tx*0.37 + ty*0.19) % 1", () => {
  configureRunMode("normal");
  const n = getLevelCount();
  let checked = 0;

  for (let i = 0; i < n; i++) {
    const def = getLevelDef(i);
    buildLevel(i);
    assert.equal(level.hazards.length, def.hazards.length, `sector ${i} hazard count`);

    def.hazards.forEach((raw, idx) => {
      const [tx, ty, , , kind = "spike", period = 1.2] = raw;
      const h = level.hazards[idx];
      const expectedPhase = (tx * 0.37 + ty * 0.19) % 1;
      assert.ok(
        Math.abs(h.phase - expectedPhase) < 1e-9,
        `sector ${i} hazard[${idx}] phase=${h.phase} expected ${expectedPhase}`
      );
      assert.equal(h.kind, kind || "spike");
      assert.equal(h.period, period);
      assert.equal(h.x, tx * TILE);
      assert.equal(h.y, ty * TILE);
      assert.equal(h.on, true);
      checked += 1;
    });
  }

  assert.ok(checked >= 10, `expected several campaign hazards, got ${checked}`);

  // Distinct tile seeds must not all collapse to the same phase.
  buildLevel(2); // Needle Path — many lasers/spikes
  const phases = new Set(level.hazards.map((h) => h.phase.toFixed(6)));
  assert.ok(phases.size >= 3, "Needle Path hazards keep staggered phases");
});
