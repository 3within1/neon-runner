import { test } from "node:test";
import assert from "node:assert/strict";
import {
  UNLOCK_DASH_SECTOR,
  UNLOCK_DOUBLE_JUMP_SECTOR,
  UNLOCK_WALL_CLING_SECTOR,
} from "../src/constants.js";
import { abilitiesForSector } from "../src/state.js";

/**
 * Sector index comes from UI / opts and can be NaN or undefined after a bad
 * parse. Mobility must fall back to sector 0 (no unlocks) instead of throwing
 * or accidentally unlocking wall/air/dash.
 */
test("abilitiesForSector treats non-finite indexes as sector 0", () => {
  const locked = {
    maxAirJumps: 0,
    canDash: false,
    canWallCling: false,
  };
  assert.deepEqual(abilitiesForSector(Number.NaN), locked);
  assert.deepEqual(abilitiesForSector(Number.POSITIVE_INFINITY), locked);
  assert.deepEqual(abilitiesForSector(undefined), locked);
  assert.deepEqual(abilitiesForSector(null), locked);
});

test("abilitiesForSector still unlocks on valid late-campaign indexes", () => {
  assert.equal(abilitiesForSector(UNLOCK_WALL_CLING_SECTOR).canWallCling, true);
  assert.equal(abilitiesForSector(UNLOCK_DOUBLE_JUMP_SECTOR).maxAirJumps, 1);
  assert.equal(abilitiesForSector(UNLOCK_DASH_SECTOR).canDash, true);
});
