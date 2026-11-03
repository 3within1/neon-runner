import { test } from "node:test";
import assert from "node:assert/strict";
import {
  UNLOCK_DASH_SECTOR,
  UNLOCK_DOUBLE_JUMP_SECTOR,
  UNLOCK_WALL_CLING_SECTOR,
} from "../src/constants.js";
import { abilitiesForSector } from "../src/state.js";

/**
 * Campaign indexes are normally integers, but a fractional finite value (e.g.
 * from a half-applied sector tween or float math) still passes Number.isFinite
 * and must unlock at the same thresholds as Math.floor would imply via `>=`.
 */
test("abilitiesForSector unlocks on fractional indexes at or past each gate", () => {
  assert.equal(abilitiesForSector(UNLOCK_WALL_CLING_SECTOR - 0.1).canWallCling, false);
  assert.equal(abilitiesForSector(UNLOCK_WALL_CLING_SECTOR + 0.1).canWallCling, true);

  assert.equal(abilitiesForSector(UNLOCK_DOUBLE_JUMP_SECTOR - 0.1).maxAirJumps, 0);
  assert.equal(abilitiesForSector(UNLOCK_DOUBLE_JUMP_SECTOR + 0.1).maxAirJumps, 1);

  assert.equal(abilitiesForSector(UNLOCK_DASH_SECTOR - 0.1).canDash, false);
  assert.equal(abilitiesForSector(UNLOCK_DASH_SECTOR + 0.1).canDash, true);
});
