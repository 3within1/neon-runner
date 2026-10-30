import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLevel, solidPlatforms } from "../src/level.js";
import { level } from "../src/state.js";

/**
 * Collision, wall cling, and footing all walk solidPlatforms(). Fallen
 * collapse pads must drop out of that list or the runner stands on air /
 * clings to ghosts after a collapse.
 */
test("solidPlatforms omits fallen collapse pads after build", () => {
  buildLevel(0);
  const before = solidPlatforms().length;
  assert.ok(before > 0);

  const pad = level.platforms.find((p) => p.kind === "collapse") || level.platforms[0];
  pad.fallen = true;

  const after = solidPlatforms();
  assert.equal(after.length, before - 1);
  assert.equal(
    after.some((p) => p === pad),
    false,
    "fallen pad excluded from solids"
  );
  assert.ok(after.every((p) => !p.fallen));

  // Restore so later files in the same process (if any) see a clean level.
  pad.fallen = false;
});
