import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatSectorClearTagline,
  getSectorStory,
  getSectorStoryCount,
  SECTOR_STORIES,
} from "../src/story.js";

test("formatSectorClearTagline includes clear beat, next uplink, and padded DATA", () => {
  const index = 0;
  const beat = getSectorStory(index);
  const line = formatSectorClearTagline(index, 42, { name: "ASCENDER" });
  assert.match(line, new RegExp(`^${beat.clear.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  assert.match(line, /Next uplink: ASCENDER\./);
  assert.match(line, /DATA 0042\./);
});

test("getSectorStory falls back to the first entry for out-of-range indices", () => {
  assert.equal(getSectorStory(-1), SECTOR_STORIES[0]);
  assert.equal(getSectorStory(getSectorStoryCount() + 3), SECTOR_STORIES[0]);
});
