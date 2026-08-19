import { test } from "node:test";
import assert from "node:assert/strict";
import { DASH_DURATION } from "../src/constants.js";
import {
  canStartDash,
  dashInvulnBoost,
  resolveDashDir,
} from "../src/physics.js";

test("resolveDashDir prefers a single held axis over facing", () => {
  assert.equal(resolveDashDir(true, false, 1), -1);
  assert.equal(resolveDashDir(false, true, -1), 1);
});

test("resolveDashDir falls back to facing when axes are idle or opposed", () => {
  assert.equal(resolveDashDir(false, false, 1), 1);
  assert.equal(resolveDashDir(false, false, -1), -1);
  assert.equal(resolveDashDir(true, true, -1), -1, "both held → facing");
  assert.equal(resolveDashDir(true, true, 1), 1);
});

test("resolveDashDir defaults to +1 when facing is zero/falsy", () => {
  assert.equal(resolveDashDir(false, false, 0), 1);
});

test("canStartDash requires ability, clear timers, and a latched press", () => {
  assert.equal(
    canStartDash({ canDash: true, dashCd: 0, dashTimer: 0, dashPressed: true }),
    true
  );
  assert.equal(
    canStartDash({ canDash: false, dashCd: 0, dashTimer: 0, dashPressed: true }),
    false,
    "locked until sector unlock"
  );
  assert.equal(
    canStartDash({ canDash: true, dashCd: 0.1, dashTimer: 0, dashPressed: true }),
    false,
    "cooldown blocks"
  );
  assert.equal(
    canStartDash({ canDash: true, dashCd: 0, dashTimer: 0.05, dashPressed: true }),
    false,
    "active dash blocks re-entry"
  );
  assert.equal(
    canStartDash({ canDash: true, dashCd: 0, dashTimer: 0, dashPressed: false }),
    false,
    "no press"
  );
});

test("dashInvulnBoost extends i-frames to 85% of dash duration", () => {
  assert.equal(dashInvulnBoost(0, DASH_DURATION), DASH_DURATION * 0.85);
  assert.equal(dashInvulnBoost(2, DASH_DURATION), 2, "keeps a longer existing timer");
  assert.ok(dashInvulnBoost(0, DASH_DURATION) < DASH_DURATION);
});
