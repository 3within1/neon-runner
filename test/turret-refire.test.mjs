import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import { turretCanFire } from "../src/level.js";

/**
 * simulation.updateTurret sets fireCd = 0.85 after a successful shot.
 * That delay must keep turretCanFire false so LOCKDOWN guns cannot machine-gun.
 * (Spawn warm-up 0.4 is covered separately; this locks the post-shot cadence.)
 */
const TURRET_REFIRE_CD = 0.85;

test("turretCanFire stays blocked for the post-shot 0.85s refire window", () => {
  const inRange = TILE * 5;
  const levelAim = 0;

  assert.equal(
    turretCanFire(0, inRange, levelAim),
    true,
    "ready gun can fire"
  );
  assert.equal(
    turretCanFire(TURRET_REFIRE_CD, inRange, levelAim),
    false,
    "fresh 0.85s refire must block"
  );
  assert.equal(
    turretCanFire(TURRET_REFIRE_CD - 0.01, inRange, levelAim),
    false,
    "still cooling"
  );
  assert.equal(
    turretCanFire(0, inRange, levelAim),
    true,
    "after cooldown drains to 0 the gun may fire again"
  );
});

test("refire delay is longer than spawn warm-up (0.4) so cadence is intentional", () => {
  assert.ok(TURRET_REFIRE_CD > 0.4);
  assert.ok(TURRET_REFIRE_CD < 2, "refire stays snappy enough for LOCKDOWN pressure");
});
