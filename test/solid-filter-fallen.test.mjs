import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLevel, solidPlatforms } from "../src/level.js";
import { level } from "../src/state.js";

/**
 * Collision / cling / footing all read solidPlatforms(). Fallen collapse pads
 * must drop out or the runner stands on air and cling probes hit ghosts.
 */
test("solidPlatforms omits fallen collapse pads", () => {
  buildLevel(0);
  const before = solidPlatforms().length;
  assert.ok(before > 0);

  const pad = level.platforms.find((p) => p.kind === "collapse") || level.platforms[0];
  pad.fallen = true;

  const solids = solidPlatforms();
  assert.equal(solids.length, before - 1);
  assert.equal(
    solids.some((p) => p === pad || p.fallen),
    false,
    "fallen pad excluded from the solid list"
  );
});
