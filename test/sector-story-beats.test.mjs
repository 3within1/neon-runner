import { test } from "node:test";
import assert from "node:assert/strict";
import { LEVELS } from "../src/level.js";
import { SECTOR_STORIES, getSectorStoryCount } from "../src/story.js";

// Jack-in announces and clear overlays read brief/clear verbatim. Empty or
// drifted copy ships as silent UX regressions (blank overlay / wrong beat).

test("every SECTOR_STORIES entry keeps non-empty brief and clear beats", () => {
  assert.equal(getSectorStoryCount(), LEVELS.length);
  assert.equal(SECTOR_STORIES.length, LEVELS.length);

  for (let i = 0; i < SECTOR_STORIES.length; i++) {
    const beat = SECTOR_STORIES[i];
    const tag = `sector ${i} (${beat.id})`;
    assert.equal(beat.id, LEVELS[i].id, `${tag}: id stays aligned with LEVELS`);
    assert.equal(typeof beat.brief, "string", `${tag}: brief type`);
    assert.equal(typeof beat.clear, "string", `${tag}: clear type`);
    assert.ok(beat.brief.trim().length > 0, `${tag}: brief non-empty`);
    assert.ok(beat.clear.trim().length > 0, `${tag}: clear non-empty`);
    assert.notEqual(beat.brief, beat.clear, `${tag}: brief and clear must differ`);
  }
});

test("sector clear beats stay unique across the campaign", () => {
  const clears = SECTOR_STORIES.map((b) => b.clear);
  assert.equal(new Set(clears).size, clears.length, "duplicate clear lines hide progression");
});
