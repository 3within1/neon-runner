import { test } from "node:test";
import assert from "node:assert/strict";
import { LEVELS, getLevelCount } from "../src/level.js";
import { SECTOR_THEMES, getSectorThemeCount } from "../src/sectorTheme.js";
import { SECTOR_STORIES, getSectorStoryCount } from "../src/story.js";
import { getMusicThemeCount } from "../src/audio.js";

// game.js asserts these invariants at init but only console.errors on mismatch,
// so a drift would ship silently. These make the same checks hard failures.

test("levels, sector themes, stories, and music share one count", () => {
  const n = getLevelCount();
  assert.ok(n > 0, "expected at least one sector");
  assert.equal(getSectorThemeCount(), n, "sector theme count matches levels");
  assert.equal(getSectorStoryCount(), n, "story count matches levels");
  assert.equal(getMusicThemeCount(), n, "music theme count matches levels");
  assert.equal(SECTOR_THEMES.length, n);
  assert.equal(SECTOR_STORIES.length, n);
});

test("level, theme, and story identities align by index", () => {
  for (let i = 0; i < LEVELS.length; i++) {
    assert.equal(SECTOR_THEMES[i].id, LEVELS[i].id, `theme id mismatch at sector ${i}`);
    assert.equal(SECTOR_THEMES[i].name, LEVELS[i].name, `theme name mismatch at sector ${i}`);
    assert.equal(SECTOR_STORIES[i].id, LEVELS[i].id, `story id mismatch at sector ${i}`);
    assert.equal(SECTOR_STORIES[i].name, LEVELS[i].name, `story name mismatch at sector ${i}`);
  }
});

test("every sector theme has a positive BPM (music scheduler would hang otherwise)", () => {
  for (let i = 0; i < SECTOR_THEMES.length; i++) {
    const { bpm } = SECTOR_THEMES[i];
    assert.ok(
      typeof bpm === "number" && Number.isFinite(bpm) && bpm > 0,
      `sector ${i} (${SECTOR_THEMES[i].id}) has non-positive/invalid bpm: ${bpm}`
    );
  }
});
