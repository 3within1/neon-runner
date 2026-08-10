import { test } from "node:test";
import assert from "node:assert/strict";
import { getMusicThemeCount } from "../src/audio.js";
import { LEVELS, getLevelCount } from "../src/level.js";
import { SECTOR_THEMES, getSectorThemeCount } from "../src/sectorTheme.js";
import { SECTOR_STORIES, getSectorStoryCount } from "../src/story.js";

test("sector tables share the same length", () => {
  const levels = getLevelCount();
  const themes = getSectorThemeCount();
  const stories = getSectorStoryCount();
  const music = getMusicThemeCount();
  assert.equal(levels, themes);
  assert.equal(levels, stories);
  assert.equal(levels, music);
});

test("sector ids and names align across level, theme, and story tables", () => {
  const n = getLevelCount();
  for (let i = 0; i < n; i++) {
    const level = LEVELS[i];
    const theme = SECTOR_THEMES[i];
    const story = SECTOR_STORIES[i];
    assert.equal(level.id, theme.id, `id mismatch at index ${i}`);
    assert.equal(level.id, story.id, `story id mismatch at index ${i}`);
    assert.equal(level.name, theme.name, `name mismatch at index ${i}`);
    assert.equal(level.name, story.name, `story name mismatch at index ${i}`);
  }
});
