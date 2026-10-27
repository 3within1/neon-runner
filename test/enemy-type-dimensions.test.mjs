import { test } from "node:test";
import assert from "node:assert/strict";
import { ENEMY_TYPES } from "../src/level.js";

test("ENEMY_TYPES entries keep finite positive combat dimensions", () => {
  for (const [name, def] of Object.entries(ENEMY_TYPES)) {
    const tag = `enemy ${name}`;
    for (const key of ["w", "h", "hp", "score", "radius", "speed", "bobAmp", "bobSpeed"]) {
      assert.ok(Number.isFinite(def[key]), `${tag}: ${key} finite`);
    }
    assert.ok(def.w > 0, `${tag}: w > 0`);
    assert.ok(def.h > 0, `${tag}: h > 0`);
    assert.ok(def.hp > 0, `${tag}: hp > 0`);
    assert.ok(def.score > 0, `${tag}: score > 0`);
    assert.ok(def.radius > 0, `${tag}: radius > 0`);
    assert.ok(def.speed >= 0, `${tag}: speed >= 0`);
    assert.ok(def.axis === "x" || def.axis === "y", `${tag}: axis x|y`);
    for (const color of ["fill", "stroke", "eye"]) {
      assert.equal(typeof def[color], "string", `${tag}: ${color} type`);
      assert.ok(def[color].length > 0, `${tag}: ${color} non-empty`);
    }
  }
});
