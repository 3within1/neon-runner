import { test } from "node:test";
import assert from "node:assert/strict";
import { COLORS } from "../src/constants.js";

// Entity/render palette tokens are shared across enemies, platforms, and HUD
// accents. A broken hex silently paints black / transparent in Canvas fills.

const REQUIRED = ["cyan", "magenta", "lime", "amber", "platform", "electric", "laser"];
const HEX = /^#[0-9a-fA-F]{6}$/;

test("COLORS exposes the gameplay palette as #rrggbb tokens", () => {
  for (const key of REQUIRED) {
    assert.ok(Object.hasOwn(COLORS, key), `missing COLORS.${key}`);
    assert.equal(typeof COLORS[key], "string", `COLORS.${key} type`);
    assert.match(COLORS[key], HEX, `COLORS.${key} must be #rrggbb`);
  }
  assert.equal(Object.keys(COLORS).length, REQUIRED.length, "no surprise palette keys");
});
