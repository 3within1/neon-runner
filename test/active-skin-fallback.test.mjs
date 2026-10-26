import { test } from "node:test";
import assert from "node:assert/strict";
import { getActiveSkin, RUNNER_SKINS, saveMeta } from "../src/meta.js";

test("getActiveSkin falls back to GRID when meta.skin is unknown", () => {
  const before = getActiveSkin();
  assert.equal(before.id, RUNNER_SKINS[before.id]?.id || "default");

  saveMeta({ skin: "not-a-real-skin" });
  const skin = getActiveSkin();
  assert.equal(skin.id, "default");
  assert.equal(skin.name, "GRID");
  assert.equal(skin.accent, RUNNER_SKINS.default.accent);

  // Restore a valid selection so later tests in this file see a clean skin.
  saveMeta({ skin: "default" });
  assert.equal(getActiveSkin().id, "default");
});
