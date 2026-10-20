import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLevel, getLevelCount } from "../src/level.js";
import { configureRunMode, level } from "../src/state.js";

/** True when mid-feet sit flush on a live platform top. */
function feetOnPad(e) {
  const midX = e.x + e.w * 0.5;
  const feetY = e.y + e.h;
  return level.platforms.some(
    (p) =>
      !p.fallen &&
      midX >= p.x &&
      midX <= p.x + p.w &&
      Math.abs(p.y - feetY) < 0.5
  );
}

/**
 * Regression for the LOCKDOWN turret float class (#34): grounded foes snap
 * feet to pad tops at spawn. Bosses and turrets share that path — a height
 * mismatch silently leaves them hovering and breaks lip-walk / stomp combat.
 */
function assertAllGroundedFeetPlanted(label) {
  const grounded = level.enemies.filter((e) => e.grounded && e.alive);
  for (const e of grounded) {
    assert.equal(
      feetOnPad(e),
      true,
      `${label}: ${e.type} at x=${e.x} feetY=${e.y + e.h} must sit on a pad`
    );
  }
  return grounded.length;
}

test("every grounded enemy plants feet on a pad after build (normal + lockdown)", () => {
  const n = getLevelCount();
  let planted = 0;

  configureRunMode("normal");
  for (let i = 0; i < n; i++) {
    buildLevel(i);
    planted += assertAllGroundedFeetPlanted(`normal sector ${i} (${level.name})`);
  }

  configureRunMode("lockdown");
  for (let i = 0; i < n; i++) {
    buildLevel(i);
    planted += assertAllGroundedFeetPlanted(`lockdown sector ${i} (${level.name})`);
  }

  // Ascender sentinel + finale rex (+ lockdown turrets) must exercise the path.
  assert.ok(planted >= 4, `expected several grounded foes across the campaign, got ${planted}`);
});
