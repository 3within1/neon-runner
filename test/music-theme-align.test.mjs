import { test } from "node:test";
import assert from "node:assert/strict";
import { getMusicThemeCount } from "../src/audio.js";
import { getLevelCount } from "../src/level.js";
import { getSectorThemeCount } from "../src/sectorTheme.js";

// audio.js THEMES, SECTOR_THEMES, and LEVELS must stay length-aligned or
// startMusic / getSectorTheme indexing drifts across campaign sectors.

test("music theme count matches LEVELS and SECTOR_THEMES lengths", () => {
  const levels = getLevelCount();
  const themes = getSectorThemeCount();
  const music = getMusicThemeCount();
  assert.equal(music, levels, "music slots vs campaign sectors");
  assert.equal(music, themes, "music slots vs visual themes");
  assert.ok(music >= 1, "at least one theme slot");
});
