import { test } from "node:test";
import assert from "node:assert/strict";
import { getMeta, markCleared } from "../src/meta.js";

/**
 * Completing the campaign (or lockdown) more than once must not duplicate
 * unlock entries or flip cleared flags back off.
 */
test("markCleared is idempotent for flags and skin unlocks", () => {
  markCleared(false);
  markCleared(false);
  assert.equal(getMeta().hasCleared, true);
  assert.equal(getMeta().lockdownCleared, false);
  assert.equal(
    getMeta().unlockedSkins.filter((id) => id === "ember").length,
    1,
    "ember unlock is not duplicated"
  );

  markCleared(true);
  markCleared(true);
  assert.equal(getMeta().lockdownCleared, true);
  assert.equal(
    getMeta().unlockedSkins.filter((id) => id === "lockdown").length,
    1,
    "lockdown unlock is not duplicated"
  );
  assert.equal(
    getMeta().unlockedSkins.filter((id) => id === "ember").length,
    1,
    "ember stays a single entry after lockdown clears"
  );
});
