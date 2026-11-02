import { test } from "node:test";
import assert from "node:assert/strict";
import { getLevelCount, getLevelDef } from "../src/level.js";
import { levelIndex, setLevelIndex } from "../src/state.js";

/**
 * Omitting the index reads the live campaign cursor. A stale closure that
 * always passed 0 would soft-lock continues on the wrong sector def.
 */
test("getLevelDef() without args uses the live levelIndex", () => {
  const prev = levelIndex;
  try {
    setLevelIndex(0);
    assert.equal(getLevelDef().id, "grid-sprint");

    const last = getLevelCount() - 1;
    setLevelIndex(last);
    assert.equal(getLevelDef().id, getLevelDef(last).id);
    assert.equal(getLevelDef().name, getLevelDef(last).name);
  } finally {
    setLevelIndex(prev);
  }
});
