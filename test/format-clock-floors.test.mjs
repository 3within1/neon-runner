import { test } from "node:test";
import assert from "node:assert/strict";
import { formatClock } from "../src/meta.js";

test("formatClock floors fractional seconds to centiseconds", () => {
  assert.equal(formatClock(1.999), "0:01.99", "does not round up to the next second");
  assert.equal(formatClock(0.009), "0:00.00", "sub-centisecond floors to .00");
  assert.equal(formatClock(0.019), "0:00.01");
  assert.equal(formatClock(61.001), "1:01.00");
});

test("formatClock keeps minute boundaries and large totals intact", () => {
  assert.equal(formatClock(59.99), "0:59.99", "does not roll into 1:00 via rounding");
  assert.equal(formatClock(60), "1:00.00");
  assert.equal(formatClock(3661.05), "61:01.05", "multi-hour clears stay readable");
});
