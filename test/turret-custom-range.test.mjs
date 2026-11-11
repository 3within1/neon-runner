import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import { turretCanFire } from "../src/level.js";

/**
 * Fire-gate helpers accept optional range / aim-band overrides for tuning.
 * Callers that pass custom limits must get exclusive edges at those limits,
 * not the hardcoded TILE*14 / TILE*3.5 defaults.
 */
test("turretCanFire honors custom range and aim-band overrides", () => {
  const range = TILE * 6;
  const maxAbsDy = TILE;

  assert.equal(turretCanFire(0, range - 1, 0, range, maxAbsDy), true);
  assert.equal(turretCanFire(0, range, 0, range, maxAbsDy), false, "range edge is exclusive");
  assert.equal(
    turretCanFire(0, TILE, maxAbsDy - 1, range, maxAbsDy),
    true,
    "inside custom aim band"
  );
  assert.equal(
    turretCanFire(0, TILE, maxAbsDy, range, maxAbsDy),
    false,
    "aim band edge is exclusive"
  );
  // Default range still applies when overrides are omitted.
  assert.equal(turretCanFire(0, TILE * 13.9, 0), true);
  assert.equal(turretCanFire(0, TILE * 14, 0), false);
});
