import { test } from "node:test";
import assert from "node:assert/strict";
import { LEVELS } from "../src/level.js";
import { SECTOR_THEMES } from "../src/sectorTheme.js";

const PALETTE = [
  "bgTop",
  "bgBot",
  "skyA",
  "skyB",
  "buildingA",
  "buildingB",
  "window",
  "grid",
  "accent",
  "particle",
];

const STYLES = new Set(["city", "towers", "needles", "swarm", "blackout", "overclock"]);

test("every sector theme ships a complete palette and valid style/density", () => {
  assert.equal(SECTOR_THEMES.length, LEVELS.length);
  for (let i = 0; i < SECTOR_THEMES.length; i++) {
    const theme = SECTOR_THEMES[i];
    const tag = `theme ${i} (${theme.id})`;

    assert.equal(theme.id, LEVELS[i].id, `${tag}: id matches LEVELS`);
    assert.equal(theme.name, LEVELS[i].name, `${tag}: name matches LEVELS`);

    for (const key of PALETTE) {
      assert.equal(typeof theme[key], "string", `${tag}: ${key} type`);
      assert.ok(theme[key].length > 0, `${tag}: ${key} non-empty`);
    }

    assert.ok(STYLES.has(theme.style), `${tag}: unknown style ${theme.style}`);
    assert.ok(
      Number.isFinite(theme.density) && theme.density > 0 && theme.density <= 1,
      `${tag}: density must be in (0, 1]`
    );
  }
});
