import { test } from "node:test";
import assert from "node:assert/strict";
import { getLevelCount, getLevelDef, LEVELS } from "../src/level.js";

/**
 * Duplicate sector codes or ids would scramble Time Trial labels, theme
 * lookup, and unlock progress that key off identity / index alignment.
 */
test("campaign level ids and sector codes are unique", () => {
  const n = getLevelCount();
  assert.equal(LEVELS.length, n);

  const ids = new Set();
  const sectors = new Set();
  for (let i = 0; i < n; i++) {
    const def = getLevelDef(i);
    assert.ok(def.id && typeof def.id === "string", `index ${i} has an id`);
    assert.ok(def.sector && typeof def.sector === "string", `index ${i} has a sector code`);
    assert.ok(def.name && typeof def.name === "string", `index ${i} has a name`);
    assert.equal(ids.has(def.id), false, `duplicate id ${def.id}`);
    assert.equal(sectors.has(def.sector), false, `duplicate sector ${def.sector}`);
    ids.add(def.id);
    sectors.add(def.sector);
    assert.ok(def.width >= 20 && def.height >= 10, `${def.id} has a playable size`);
    assert.ok(Array.isArray(def.enemies), `${def.id} lists enemies`);
    assert.ok(Array.isArray(def.platforms) && def.platforms.length > 0, `${def.id} has pads`);
  }
});
