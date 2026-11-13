import { test } from "node:test";
import assert from "node:assert/strict";
import { COLORS } from "../src/constants.js";
import { ENEMY_TYPES } from "../src/level.js";

// Combat strokes/eyes/thrusters share the gameplay COLORS catalog so a
// palette rename cannot silently desync enemy art from HUD/platform accents.
// Rex / RexBoss use a custom crimson eye outside the shared catalog.

const SHARED = new Set(Object.values(COLORS));
const CUSTOM_EYES = new Set(["rex", "rexBoss"]);

test("ENEMY_TYPES stroke/eye/thruster stay on COLORS tokens (except rex eyes)", () => {
  for (const [type, def] of Object.entries(ENEMY_TYPES)) {
    assert.ok(SHARED.has(def.stroke), `${type}.stroke must be a COLORS value`);
    assert.ok(SHARED.has(def.thruster), `${type}.thruster must be a COLORS value`);
    if (CUSTOM_EYES.has(type)) {
      assert.match(def.eye, /^#[0-9a-fA-F]{6}$/, `${type}.eye custom hex`);
      assert.equal(def.eye, "#ff3030", `${type}.eye stays the authored crimson`);
      assert.equal(SHARED.has(def.eye), false, `${type}.eye is intentionally off-catalog`);
    } else {
      assert.ok(SHARED.has(def.eye), `${type}.eye must be a COLORS value`);
    }
  }
});
