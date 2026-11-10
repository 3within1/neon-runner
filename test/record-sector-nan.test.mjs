import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getSectorBestTime,
  recordSectorTime,
} from "../src/meta.js";

/**
 * Time-trial writes must reject NaN seconds. `!(NaN > 0)` is true, so the
 * guard should no-op — if it ever starts comparing with `<` without the
 * positivity check, NaN would wipe a real best.
 */
test("recordSectorTime rejects NaN seconds without corrupting bests", () => {
  const ok = recordSectorTime(4, 18.5);
  assert.equal(ok.improved, true);
  assert.equal(getSectorBestTime(4), 18.5);

  const rejected = recordSectorTime(4, Number.NaN);
  assert.equal(rejected.improved, false);
  assert.equal(rejected.best, Infinity);
  assert.equal(getSectorBestTime(4), 18.5, "prior best survives NaN write");
});
