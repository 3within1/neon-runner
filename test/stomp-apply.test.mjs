import { test } from "node:test";
import assert from "node:assert/strict";
import { INVULN_STOMP, STOMP_BOUNCE } from "../src/constants.js";
import {
  resolveStompEnemyHit,
  resolveStompPlayerImpulse,
} from "../src/physics.js";

test("resolveStompPlayerImpulse bounces, exempts jump-cut, and boosts i-frames", () => {
  assert.deepEqual(resolveStompPlayerImpulse(0), {
    vy: STOMP_BOUNCE,
    jumpCutExempt: true,
    invuln: INVULN_STOMP,
  });
  assert.deepEqual(
    resolveStompPlayerImpulse(1.0),
    {
      vy: STOMP_BOUNCE,
      jumpCutExempt: true,
      invuln: 1.0,
    },
    "longer existing invuln is preserved"
  );
});

test("resolveStompEnemyHit chips HP and clears charge/slam state", () => {
  assert.deepEqual(
    resolveStompEnemyHit({ hp: 3, charging: 0.7, airborne: true, chargeCd: 1.2 }),
    { hp: 2, charging: 0, airborne: false, chargeCd: 1.2 }
  );
});

test("resolveStompEnemyHit truncates boss chargeCd so the next slam is not delayed", () => {
  assert.deepEqual(
    resolveStompEnemyHit({
      hp: 8,
      boss: true,
      charging: 0.5,
      airborne: true,
      chargeCd: 1.4,
    }),
    { hp: 7, charging: 0, airborne: false, chargeCd: 0.35 }
  );
  assert.deepEqual(
    resolveStompEnemyHit({
      hp: 8,
      boss: true,
      charging: 0,
      airborne: false,
      chargeCd: 0.2,
    }),
    { hp: 7, charging: 0, airborne: false, chargeCd: 0.2 },
    "already-short boss chargeCd is left alone"
  );
});
