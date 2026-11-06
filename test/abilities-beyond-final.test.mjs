import { test } from "node:test";
import assert from "node:assert/strict";
import { UNLOCK_DASH_SECTOR } from "../src/constants.js";
import { abilitiesForSector } from "../src/state.js";
import { getLevelCount } from "../src/level.js";

/**
 * Practice / legacy unlocks can pass an index past the campaign length.
 * All mobility gates use `>=`, so large finite indexes must stay fully unlocked.
 */
test("abilitiesForSector unlocks everything past the final campaign index", () => {
  const past = getLevelCount() + 10;
  assert.ok(past > UNLOCK_DASH_SECTOR);

  const unlocked = {
    maxAirJumps: 1,
    canDash: true,
    canWallCling: true,
  };
  assert.deepEqual(abilitiesForSector(UNLOCK_DASH_SECTOR), unlocked);
  assert.deepEqual(abilitiesForSector(past), unlocked);
});
