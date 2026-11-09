import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatSectorClearTagline,
  getSectorStory,
} from "../src/story.js";

test("formatSectorClearTagline pads fractional DATA without inventing digits", () => {
  const beat = getSectorStory(0);
  const line = formatSectorClearTagline(0, 3.7, { name: "ASCENDER" });
  assert.match(line, new RegExp(`^${beat.clear.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  assert.match(line, /Next uplink: ASCENDER\./);
  // String(3.7).padStart(4,"0") → "03.7" (length-4 pad, not "003.7" / "004").
  assert.match(line, /DATA 03\.7\./);
  assert.doesNotMatch(line, /DATA 004/);
});
