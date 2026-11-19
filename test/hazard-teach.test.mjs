import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLevel, getLevelCount, getLevelDef } from "../src/level.js";
import { configureRunMode, level } from "../src/state.js";

/**
 * Campaign teaching order: electric appears on Grid Sprint, lasers debut on
 * Ascender, Overclock / Blackout densify both. Dropping a kind from the opener
 * silently removes the mechanic tutorial for new runners.
 */
test("hazard teaching roster keeps electric and laser debut sectors", () => {
  configureRunMode("normal");

  buildLevel(0);
  const gridKinds = new Set(level.hazards.map((h) => h.kind));
  assert.equal(gridKinds.has("electric"), true, "Grid Sprint teaches electric");
  assert.equal(gridKinds.has("laser"), false, "lasers stay off Grid Sprint");
  assert.ok(gridKinds.has("spike"), "Grid Sprint still has spikes");

  buildLevel(1);
  const ascKinds = new Set(level.hazards.map((h) => h.kind));
  assert.equal(ascKinds.has("laser"), true, "Ascender debuts lasers");
  assert.ok(
    level.hazards.filter((h) => h.kind === "laser").length >= 2,
    "Ascender mirrors laser gates"
  );

  buildLevel(4);
  const overclock = level.hazards.filter((h) => h.kind === "laser");
  const overclockElectric = level.hazards.filter((h) => h.kind === "electric");
  assert.ok(overclock.length >= 3, "Overclock Span densifies lasers");
  assert.ok(overclockElectric.length >= 2, "Overclock keeps electric pressure");

  buildLevel(getLevelCount() - 1);
  const finaleKinds = new Set(level.hazards.map((h) => h.kind));
  assert.equal(finaleKinds.has("laser"), false, "Rex Core is not a laser gauntlet");
  assert.equal(finaleKinds.has("electric"), true, "Rex Core keeps an electric tell");
});

test("every sector ships at least one hazard", () => {
  configureRunMode("normal");
  const n = getLevelCount();
  for (let i = 0; i < n; i++) {
    const def = getLevelDef(i);
    buildLevel(i);
    assert.ok(
      level.hazards.length >= 1,
      `sector ${i} (${def.name}) needs at least one hazard`
    );
    assert.equal(level.hazards.length, def.hazards.length);
  }
});
