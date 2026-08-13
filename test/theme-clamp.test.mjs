import { test } from "node:test";
import assert from "node:assert/strict";
import { getSectorTheme, getSectorThemeCount, SECTOR_THEMES } from "../src/sectorTheme.js";
import { RUN_STORY } from "../src/story.js";

test("getSectorTheme clamps out-of-range and non-finite indexes", () => {
  const last = SECTOR_THEMES.length - 1;
  assert.equal(getSectorTheme(-1).id, SECTOR_THEMES[0].id);
  assert.equal(getSectorTheme(99).id, SECTOR_THEMES[last].id);
  assert.equal(getSectorTheme(Number.NaN).id, SECTOR_THEMES[0].id);
  assert.equal(getSectorTheme(2.9).id, SECTOR_THEMES[2].id, "floors fractional indexes");
  assert.equal(getSectorThemeCount(), SECTOR_THEMES.length);
});

test("RUN_STORY win lines zero-pad DATA and distinguish lockdown", () => {
  assert.match(RUN_STORY.win(7), /DATA 0007/);
  assert.match(RUN_STORY.lockdownWin(120), /DATA 0120/);
  assert.match(RUN_STORY.lockdownWin(42), /Lockdown broken/);
  assert.equal(typeof RUN_STORY.death, "string");
  assert.ok(RUN_STORY.death.length > 0);
});
