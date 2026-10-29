import { test } from "node:test";
import assert from "node:assert/strict";
import { COLORS } from "../src/constants.js";
import { RUNNER_SKINS } from "../src/meta.js";

// Runner accent/trim/core share COLORS so HUD chrome and player sprites stay
// on the same neon tokens. Body fills are intentionally darker customs.

const SHARED = new Set(Object.values(COLORS));
const HEX = /^#[0-9a-fA-F]{6}$/;

test("RUNNER_SKINS accent/trim stay on COLORS; body/core allow authored customs", () => {
  const ids = Object.keys(RUNNER_SKINS);
  assert.ok(ids.includes("default"));
  assert.ok(ids.includes("signal"));
  assert.ok(ids.includes("ember"));
  assert.ok(ids.includes("lockdown"));

  for (const id of ids) {
    const skin = RUNNER_SKINS[id];
    assert.equal(skin.id, id);
    assert.match(skin.body, HEX, `${id}.body hex`);
    assert.match(skin.core, HEX, `${id}.core hex`);
    assert.ok(SHARED.has(skin.accent), `${id}.accent must be a COLORS value`);
    assert.ok(SHARED.has(skin.trim), `${id}.trim must be a COLORS value`);
  }

  // LOCKDOWN core is an intentional off-catalog warning red.
  assert.equal(RUNNER_SKINS.lockdown.core, "#ff6060");
  assert.equal(SHARED.has(RUNNER_SKINS.lockdown.core), false);
});
