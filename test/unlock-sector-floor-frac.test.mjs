import { test } from "node:test";
import assert from "node:assert/strict";
import { getUnlockedSector, unlockSector } from "../src/meta.js";

/**
 * Sector unlock indexes are floored before compare. A fractional advance
 * (e.g. 4.9 from float math) must unlock only the integer floor, never skip
 * ahead to the next whole sector.
 */
test("unlockSector floors fractional indexes before advancing", () => {
  const before = getUnlockedSector();
  assert.equal(unlockSector(before + 2.9), before + 2);
  assert.equal(getUnlockedSector(), before + 2);

  assert.equal(
    unlockSector(before + 2.1),
    before + 2,
    "a lower fractional floor does not change progress"
  );
  assert.equal(getUnlockedSector(), before + 2);
});
