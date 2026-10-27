import { test } from "node:test";
import assert from "node:assert/strict";
import { LEVELS, getLevelCount } from "../src/level.js";

const KINDS = new Set(["spike", "electric", "laser"]);

test("LEVELS hazard defs only author spike, electric, or laser kinds", () => {
  const n = getLevelCount();
  assert.equal(LEVELS.length, n);
  for (let i = 0; i < n; i++) {
    const def = LEVELS[i];
    for (const row of def.hazards) {
      const kind = row[4];
      const period = row[5];
      if (kind !== undefined) {
        assert.ok(
          KINDS.has(kind),
          `sector ${i} (${def.name}): unknown hazard kind ${kind}`
        );
      }
      if (period !== undefined) {
        assert.ok(
          Number.isFinite(period) && period > 0,
          `sector ${i} (${def.name}): hazard period must be finite > 0`
        );
      }
    }
  }
});
