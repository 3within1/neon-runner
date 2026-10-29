import { test } from "node:test";
import assert from "node:assert/strict";
import { LEVELS, getLevelCount } from "../src/level.js";

// Sector year strings drive UI labels and Time Trial ordering. A regression
// that reorders or duplicates years breaks campaign navigation copy.

test("LEVELS sector years are four-digit strings and strictly increasing", () => {
  assert.equal(LEVELS.length, getLevelCount());
  assert.ok(LEVELS.length >= 2, "campaign has multiple sectors");

  let prev = -Infinity;
  for (let i = 0; i < LEVELS.length; i++) {
    const year = LEVELS[i].sector;
    assert.equal(typeof year, "string", `sector[${i}] type`);
    assert.match(year, /^\d{4}$/, `sector[${i}] must be a 4-digit year`);
    const n = Number(year);
    assert.ok(n > prev, `sector[${i}] ${year} must be > previous ${prev}`);
    prev = n;
  }
});

test("LEVELS authoring keeps positive tile dimensions and in-bounds spawn/exit", () => {
  for (const def of LEVELS) {
    assert.ok(def.width > 0 && def.height > 0, `${def.id} size`);
    const [sx, sy] = def.spawn;
    const [ex, ey] = def.exit;
    assert.ok(sx >= 0 && sx < def.width, `${def.id} spawn x`);
    assert.ok(sy >= 0 && sy < def.height, `${def.id} spawn y`);
    assert.ok(ex >= 0 && ex < def.width, `${def.id} exit x`);
    assert.ok(ey >= 0 && ey < def.height, `${def.id} exit y`);
  }
});
