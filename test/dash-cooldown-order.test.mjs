import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DASH_COOLDOWN,
  DASH_DURATION,
  DASH_SPEED,
} from "../src/constants.js";

test("dash cooldown outlasts the burst so re-dash cannot chain mid-dash", () => {
  assert.ok(DASH_DURATION > 0);
  assert.ok(DASH_COOLDOWN > DASH_DURATION, "cooldown must exceed burst length");
  assert.ok(DASH_SPEED * DASH_DURATION >= 140, "burst still covers ~3 tiles at 48px");
  // Remaining downtime after the burst ends (player-facing recovery).
  assert.ok(DASH_COOLDOWN - DASH_DURATION >= 0.2);
});
