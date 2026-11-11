import { test } from "node:test";
import assert from "node:assert/strict";
import { UNLOCK_DASH_SECTOR, UNLOCK_WALL_CLING_SECTOR } from "../src/constants.js";
import { abilitiesForSector } from "../src/state.js";

/**
 * Sector indexes sometimes arrive as strings from UI datasets / URL params.
 * Number.isFinite("2") is false, so they must fall back to locked sector-0
 * mobility — not throw, and not accidentally unlock via numeric coercion.
 */
test("abilitiesForSector treats string / object indexes as sector 0", () => {
  const locked = {
    maxAirJumps: 0,
    canDash: false,
    canWallCling: false,
  };

  assert.deepEqual(abilitiesForSector(/** @type {any} */ ("2")), locked);
  assert.deepEqual(
    abilitiesForSector(/** @type {any} */ (String(UNLOCK_WALL_CLING_SECTOR))),
    locked,
    "stringified unlock index must not unlock wall cling"
  );
  assert.deepEqual(
    abilitiesForSector(/** @type {any} */ (String(UNLOCK_DASH_SECTOR))),
    locked,
    "stringified unlock index must not unlock dash"
  );
  assert.deepEqual(abilitiesForSector(/** @type {any} */ ({})), locked);
  assert.deepEqual(abilitiesForSector(/** @type {any} */ ([5])), locked);
});

test("abilitiesForSector still unlocks on numeric indexes past the gates", () => {
  assert.equal(abilitiesForSector(UNLOCK_WALL_CLING_SECTOR).canWallCling, true);
  assert.equal(abilitiesForSector(UNLOCK_DASH_SECTOR).canDash, true);
});
