import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLevel, getLevelCount } from "../src/level.js";
import { level } from "../src/state.js";

test("buildLevel leaves every checkpoint unactivated", () => {
  const n = getLevelCount();
  let total = 0;
  for (let i = 0; i < n; i++) {
    buildLevel(i);
    for (const c of level.checkpoints) {
      total += 1;
      assert.equal(c.activated, false, `sector ${i} checkpoint starts inactive`);
      assert.ok(c.w > 0 && c.h > 0, `sector ${i} checkpoint has a hit box`);
    }
  }
  assert.ok(total >= n, "campaign has at least one checkpoint per sector on average");
});
