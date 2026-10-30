import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatSectorClearTagline,
  getSectorStory,
  getSectorStoryCount,
  SECTOR_STORIES,
} from "../src/story.js";

/**
 * Overlay body for sector clear uses getSectorStory, which falls back to the
 * first beat for junk indexes. A regression that started throwing / reading
 * undefined.clear would blank the continue screen.
 */
test("formatSectorClearTagline falls back to the first beat for junk indexes", () => {
  const fallback = SECTOR_STORIES[0];
  const next = { name: "NEEDLE PATH" };
  const oob = getSectorStoryCount() + 9;

  assert.equal(getSectorStory(oob), fallback);

  const line = formatSectorClearTagline(oob, 99, next);
  assert.match(
    line,
    new RegExp(`^${fallback.clear.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`)
  );
  assert.match(line, /Next uplink: NEEDLE PATH\./);
  assert.match(line, /DATA 0099\./);

  const neg = formatSectorClearTagline(-4, 0, next);
  assert.match(
    neg,
    new RegExp(`^${fallback.clear.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`)
  );
  assert.match(neg, /DATA 0000\./);
});
