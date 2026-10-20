import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLevel } from "../src/level.js";
import { configureRunMode, level } from "../src/state.js";

/**
 * Turrets spawn with a short warm-up so LOCKDOWN guns do not snipe on frame 0
 * when the runner shares their lane at jack-in / sector entry.
 */
test("LOCKDOWN turrets spawn with a positive fire cooldown", () => {
  configureRunMode("lockdown");
  const sectorsWithTurrets = [2, 3, 5];
  let seen = 0;

  for (const index of sectorsWithTurrets) {
    buildLevel(index);
    const turrets = level.enemies.filter((e) => e.turret);
    assert.ok(turrets.length > 0, `sector ${index} should spawn turrets in lockdown`);
    for (const t of turrets) {
      assert.ok(t.fireCd > 0, `sector ${index} turret fireCd must be warm`);
      assert.equal(t.fireCd, 0.4, "spawn warm-up stays at 0.4s");
      seen += 1;
    }
  }

  assert.ok(seen >= 4, "expected Needle/Swarm/Blackout turret roster");
});
