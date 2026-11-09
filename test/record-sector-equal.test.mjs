import { test } from "node:test";
import assert from "node:assert/strict";
import { getSectorBestTime, recordSectorTime } from "../src/meta.js";

/**
 * Sector bests use a strict faster-than check (same contract as full-clear
 * times). An equal duration must not rewrite bestTimes[i] or flip improved,
 * or Time Trial UI will churn "new best" on every matching rerun.
 */
test("recordSectorTime ignores an equal duration", () => {
  const first = recordSectorTime(4, 42.5);
  assert.deepEqual(first, { best: 42.5, improved: true });
  assert.equal(getSectorBestTime(4), 42.5);

  const tie = recordSectorTime(4, 42.5);
  assert.equal(tie.improved, false, "equal time is not an improvement");
  assert.equal(tie.best, 42.5, "returns the existing best");
  assert.equal(getSectorBestTime(4), 42.5, "storage unchanged on a tie");

  const faster = recordSectorTime(4, 42.4);
  assert.deepEqual(faster, { best: 42.4, improved: true });
  assert.equal(getSectorBestTime(4), 42.4);
});
