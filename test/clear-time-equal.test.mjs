import { test } from "node:test";
import assert from "node:assert/strict";
import { getBestClearTime, recordClearTime } from "../src/meta.js";

/**
 * Full-campaign best uses a strict faster-than check. An equal time must not
 * rewrite bestClearTime (avoids churning persist + false "new best" UX).
 */
test("recordClearTime ignores an equal duration", () => {
  assert.equal(recordClearTime(100), 100);
  assert.equal(getBestClearTime(), 100);

  assert.equal(recordClearTime(100), 100, "tie keeps the existing best");
  assert.equal(getBestClearTime(), 100);

  assert.equal(recordClearTime(99.9), 99.9, "a true improvement still wins");
  assert.equal(getBestClearTime(), 99.9);
});
