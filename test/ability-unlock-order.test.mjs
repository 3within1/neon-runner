import { test } from "node:test";
import assert from "node:assert/strict";
import {
  UNLOCK_DASH_SECTOR,
  UNLOCK_DOUBLE_JUMP_SECTOR,
  UNLOCK_WALL_CLING_SECTOR,
} from "../src/constants.js";
import { LEVELS } from "../src/level.js";
import { abilitiesForSector } from "../src/state.js";

test("ability unlock sectors stay ordered and match campaign ids", () => {
  assert.ok(UNLOCK_WALL_CLING_SECTOR < UNLOCK_DOUBLE_JUMP_SECTOR);
  assert.ok(UNLOCK_DOUBLE_JUMP_SECTOR < UNLOCK_DASH_SECTOR);

  assert.equal(LEVELS[UNLOCK_WALL_CLING_SECTOR].id, "ascender");
  assert.equal(LEVELS[UNLOCK_DOUBLE_JUMP_SECTOR].id, "needle-path");
  assert.equal(LEVELS[UNLOCK_DASH_SECTOR].id, "blackout-run");

  const beforeCling = abilitiesForSector(UNLOCK_WALL_CLING_SECTOR - 1);
  assert.equal(beforeCling.canWallCling, false);
  assert.equal(beforeCling.maxAirJumps, 0);
  assert.equal(beforeCling.canDash, false);

  const atCling = abilitiesForSector(UNLOCK_WALL_CLING_SECTOR);
  assert.equal(atCling.canWallCling, true);
  assert.equal(atCling.maxAirJumps, 0);
  assert.equal(atCling.canDash, false);

  const atAir = abilitiesForSector(UNLOCK_DOUBLE_JUMP_SECTOR);
  assert.equal(atAir.canWallCling, true);
  assert.equal(atAir.maxAirJumps, 1);
  assert.equal(atAir.canDash, false);

  const atDash = abilitiesForSector(UNLOCK_DASH_SECTOR);
  assert.equal(atDash.canWallCling, true);
  assert.equal(atDash.maxAirJumps, 1);
  assert.equal(atDash.canDash, true);
});
