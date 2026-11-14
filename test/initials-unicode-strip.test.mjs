import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeInitials } from "../src/leaderboard.js";

// Score tags must stay [A-Z0-9]{3}. Unicode / emoji / nullish input must not
// poison localStorage or the leaderboard list with blank / multi-codepoint tags.

test("normalizeInitials strips unicode, emoji, and whitespace", () => {
  assert.equal(normalizeInitials("あA🎉b"), "ABX");
  assert.equal(normalizeInitials("  a  "), "AXX");
  assert.equal(normalizeInitials("🚀🚀🚀"), "RUN", "emoji-only falls back to RUN");
  assert.equal(normalizeInitials("nø1"), "N1X", "latin-1 letter with diacritic is dropped");
});

test("normalizeInitials coerces nullish and non-string values to RUN or pads digits", () => {
  assert.equal(normalizeInitials(null), "RUN");
  assert.equal(normalizeInitials(undefined), "RUN");
  assert.equal(normalizeInitials(7), "7XX");
  // `value || ""` treats numeric 0 as empty, so the default tag is used.
  assert.equal(normalizeInitials(0), "RUN");
});
