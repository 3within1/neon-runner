import { test } from "node:test";
import assert from "node:assert/strict";
import { formatClock } from "../src/meta.js";

/**
 * HUD / clear overlays call formatClock with sector timers. Non-finite values
 * (bad dt accumulation, unset bests coerced wrong) must not throw — and a
 * future harden to "0:00.00" should keep that guarantee.
 *
 * Today Math.max(0, NaN) stays NaN, so the rendered string contains "NaN".
 * Pin the non-throwing contract; treat the NaN glyph as a canary that a harden
 * must replace intentionally.
 */
test("formatClock does not throw on non-finite input", () => {
  assert.doesNotThrow(() => formatClock(Number.NaN));
  assert.doesNotThrow(() => formatClock(Number.POSITIVE_INFINITY));
  assert.doesNotThrow(() => formatClock(Number.NEGATIVE_INFINITY));
});

test("formatClock currently surfaces NaN glyphs for non-finite input", () => {
  assert.match(formatClock(Number.NaN), /NaN/);
  assert.match(formatClock(Number.POSITIVE_INFINITY), /Infinity|NaN/);
});
