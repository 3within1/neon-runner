import { test } from "node:test";
import assert from "node:assert/strict";
import {
  UNLOCK_DASH_SECTOR,
  UNLOCK_DOUBLE_JUMP_SECTOR,
  UNLOCK_WALL_CLING_SECTOR,
} from "../src/constants.js";
import { abilitiesForSector } from "../src/state.js";

/**
 * Negative finite indexes are still finite, so they skip the non-finite→0
 * fallback and rely on the `>=` unlock gates. They must stay fully locked —
 * never unlock wall cling / air jump / dash by accident.
 */
test("abilitiesForSector keeps negative finite indexes fully locked", () => {
  const locked = {
    maxAirJumps: 0,
    canDash: false,
    canWallCling: false,
  };
  assert.deepEqual(abilitiesForSector(-1), locked);
  assert.deepEqual(abilitiesForSector(-UNLOCK_WALL_CLING_SECTOR), locked);
  assert.deepEqual(abilitiesForSector(-UNLOCK_DOUBLE_JUMP_SECTOR), locked);
  assert.deepEqual(abilitiesForSector(-UNLOCK_DASH_SECTOR), locked);
});
