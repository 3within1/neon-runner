import { test } from "node:test";
import assert from "node:assert/strict";
import { getLevelCount, getLevelDef } from "../src/level.js";

test("getLevelDef returns campaign defs at the first and last indexes", () => {
  const n = getLevelCount();
  assert.ok(n >= 1, "campaign has at least one sector");

  const first = getLevelDef(0);
  assert.equal(typeof first.id, "string");
  assert.equal(typeof first.name, "string");
  assert.ok(Array.isArray(first.platforms) && first.platforms.length > 0);

  const last = getLevelDef(n - 1);
  assert.equal(typeof last.id, "string");
  assert.equal(typeof last.name, "string");
  assert.ok(Array.isArray(last.platforms) && last.platforms.length > 0);
  assert.notEqual(last.id, first.id, "finale id differs from sector 0");
});

test("getLevelDef throws for out-of-range indexes", () => {
  const n = getLevelCount();
  assert.throws(() => getLevelDef(-1), /Invalid level index/);
  assert.throws(() => getLevelDef(n), /Invalid level index/);
  assert.throws(() => getLevelDef(n + 5), /Invalid level index/);
});
