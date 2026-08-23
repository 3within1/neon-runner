import { test } from "node:test";
import assert from "node:assert/strict";
import { getLevelCount, getLevelDef } from "../src/level.js";

test("getLevelDef returns the campaign entry for a valid index", () => {
  const n = getLevelCount();
  assert.ok(n >= 7);
  const first = getLevelDef(0);
  assert.equal(first.sector, "2084");
  assert.ok(first.name);
  const last = getLevelDef(n - 1);
  assert.ok(last.sector);
  assert.ok(last.name);
});

test("getLevelDef throws on out-of-range and non-campaign indices", () => {
  const n = getLevelCount();
  assert.throws(() => getLevelDef(-1), /Invalid level index/);
  assert.throws(() => getLevelDef(n), /Invalid level index/);
  assert.throws(() => getLevelDef(n + 5), /Invalid level index/);
});
