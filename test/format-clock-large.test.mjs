import { test } from "node:test";
import assert from "node:assert/strict";
import { formatClock } from "../src/meta.js";

/**
 * Long campaign / lockdown clears can exceed an hour. Minutes are unpadded on
 * purpose; seconds and centiseconds stay zero-padded so HUD/best-time strings
 * stay sortable by eye.
 */
test("formatClock renders multi-hour durations without truncating minutes", () => {
  assert.equal(formatClock(3661.5), "61:01.50");
  assert.equal(formatClock(600), "10:00.00");
  assert.equal(formatClock(59.999), "0:59.99", "centiseconds floor, not round");
});
