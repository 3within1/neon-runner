import { test } from "node:test";
import assert from "node:assert/strict";
import { getLevelCount, getLevelDef } from "../src/level.js";

/**
 * buildLevel / continue flow index through getLevelDef. Out-of-range indexes
 * must throw loudly rather than return undefined and corrupt the singleton.
 */
test("getLevelDef rejects out-of-range indexes", () => {
  const n = getLevelCount();
  assert.ok(n >= 7);
  assert.equal(getLevelDef(0).id, "grid-sprint");
  assert.throws(() => getLevelDef(-1), /Invalid level index/);
  assert.throws(() => getLevelDef(n), /Invalid level index/);
  assert.throws(() => getLevelDef(n + 3), /Invalid level index/);
  assert.equal(typeof getLevelDef(n - 1).name, "string");
  assert.equal(typeof getLevelDef(n - 1).id, "string");
});
