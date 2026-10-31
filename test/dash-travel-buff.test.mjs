import { test } from "node:test";
import assert from "node:assert/strict";
import { DASH_COOLDOWN, DASH_DURATION, DASH_SPEED } from "../src/constants.js";

/** Default grounded run clamp used by integrateRunVelocity. */
const RUN_MAX_SPEED = 280;

/**
 * Dash was buffed specifically so a burst clearly outruns a full-speed sprint
 * over the dash window (620→900 px/s, 0.16→0.18s). Lock the displacement ratio
 * so a future tuning pass cannot silently re-introduce "dash feels like a jog".
 */
test("one dash covers clearly more ground than sprinting for the same window", () => {
  const dashDist = DASH_SPEED * DASH_DURATION;
  const runDist = RUN_MAX_SPEED * DASH_DURATION;
  assert.ok(DASH_DURATION > 0, "dash duration must be positive");
  assert.ok(DASH_COOLDOWN > 0, "dash cooldown must be positive");
  assert.ok(
    dashDist / runDist >= 2,
    `dash/run displacement ratio ${dashDist / runDist} must stay ≥ 2`
  );
  assert.ok(DASH_COOLDOWN > DASH_DURATION, "cooldown outlasts the burst itself");
});
