import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getActiveSkin,
  getMeta,
  setSkin,
  unlockSkin,
} from "../src/meta.js";

// Score unlocks must be selectable once awarded. A stuck default skin after
// unlocking SIGNAL is a silent progression regression.

test("unlockSkin then setSkin selects the newly unlocked runner", () => {
  const before = getMeta().skin;
  assert.equal(getMeta().unlockedSkins.includes("signal"), false);

  unlockSkin("signal");
  assert.ok(getMeta().unlockedSkins.includes("signal"));

  assert.equal(setSkin("signal"), "signal");
  assert.equal(getMeta().skin, "signal");
  assert.equal(getActiveSkin().id, "signal");
  assert.equal(getActiveSkin().name, "SIGNAL");

  // Unknown / still-locked ids must not clobber the selection.
  assert.equal(setSkin("not-a-skin"), "signal");
  assert.equal(getMeta().skin, "signal");

  // Restore default so later assertions in this file stay predictable.
  assert.equal(setSkin(before), before);
});

test("unlockSkin is idempotent for an already-unlocked id", () => {
  unlockSkin("signal");
  const once = getMeta().unlockedSkins.filter((id) => id === "signal").length;
  unlockSkin("signal");
  const twice = getMeta().unlockedSkins.filter((id) => id === "signal").length;
  assert.equal(once, 1);
  assert.equal(twice, 1, "does not duplicate the unlock entry");
});
