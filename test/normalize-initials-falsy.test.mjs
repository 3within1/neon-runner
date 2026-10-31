import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeInitials } from "../src/leaderboard.js";

/**
 * normalizeInitials uses `String(value || "")`, so falsy non-strings (0, null,
 * undefined) must fall back to RUN — not coerce into surprising tags like "0XX".
 */
test("normalizeInitials maps falsy inputs to the RUN default", () => {
  assert.equal(normalizeInitials(0), "RUN");
  assert.equal(normalizeInitials(null), "RUN");
  assert.equal(normalizeInitials(undefined), "RUN");
  assert.equal(normalizeInitials(false), "RUN");
});

test("normalizeInitials still accepts numeric-looking strings", () => {
  assert.equal(normalizeInitials("0"), "0XX");
  assert.equal(normalizeInitials("9a"), "9AX");
});
