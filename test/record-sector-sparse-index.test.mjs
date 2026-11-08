import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getSectorBestTime,
  recordSectorTime,
} from "../src/meta.js";

test("recordSectorTime grows bestTimes for sparse high sector indexes", () => {
  const first = recordSectorTime(0, 20);
  assert.deepEqual(first, { best: 20, improved: true });

  const deep = recordSectorTime(4, 12.5);
  assert.deepEqual(deep, { best: 12.5, improved: true });
  assert.equal(getSectorBestTime(4), 12.5);
  assert.equal(getSectorBestTime(2), 0, "unfilled gap stays zero");
  assert.equal(getSectorBestTime(0), 20, "earlier sector best stays intact");
});
