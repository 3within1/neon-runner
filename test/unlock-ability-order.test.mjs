import { test } from "node:test";
import assert from "node:assert/strict";
import {
  UNLOCK_DASH_SECTOR,
  UNLOCK_DOUBLE_JUMP_SECTOR,
  UNLOCK_WALL_CLING_SECTOR,
} from "../src/constants.js";
import { abilitiesForSector } from "../src/state.js";
import { getLevelCount } from "../src/level.js";

// Ability gates are authored as ascending campaign indexes. Swapping the
// constants would teach dash before wall cling and break sector briefs.

test("ability unlock sector indexes stay strictly ascending within the campaign", () => {
  assert.ok(UNLOCK_WALL_CLING_SECTOR < UNLOCK_DOUBLE_JUMP_SECTOR);
  assert.ok(UNLOCK_DOUBLE_JUMP_SECTOR < UNLOCK_DASH_SECTOR);
  assert.ok(UNLOCK_WALL_CLING_SECTOR >= 0);
  assert.ok(UNLOCK_DASH_SECTOR < getLevelCount(), "dash unlocks before the finale index runs out");
});

test("abilitiesForSector mirrors the unlock constant thresholds", () => {
  assert.equal(abilitiesForSector(UNLOCK_WALL_CLING_SECTOR - 1).canWallCling, false);
  assert.equal(abilitiesForSector(UNLOCK_WALL_CLING_SECTOR).canWallCling, true);
  assert.equal(abilitiesForSector(UNLOCK_DOUBLE_JUMP_SECTOR - 1).maxAirJumps, 0);
  assert.equal(abilitiesForSector(UNLOCK_DOUBLE_JUMP_SECTOR).maxAirJumps, 1);
  assert.equal(abilitiesForSector(UNLOCK_DASH_SECTOR - 1).canDash, false);
  assert.equal(abilitiesForSector(UNLOCK_DASH_SECTOR).canDash, true);
});
