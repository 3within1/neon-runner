import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLevel, solidPlatforms } from "../src/level.js";
import { level } from "../src/state.js";

/**
 * Collision / cling / resolveAxis all walk solidPlatforms(). A fallen collapse
 * pad that stays in that list becomes an invisible mid-air ledge.
 */
test("solidPlatforms excludes fallen collapse pads", () => {
  buildLevel(0);
  const collapse = level.platforms.find((p) => p.kind === "collapse");
  assert.ok(collapse, "Grid Sprint seeds at least one collapse pad");

  const before = solidPlatforms().length;
  assert.ok(solidPlatforms().includes(collapse), "armed pad is still solid");

  collapse.fallen = true;
  const after = solidPlatforms();
  assert.equal(after.length, before - 1);
  assert.equal(
    after.includes(collapse),
    false,
    "fallen collapse must drop out of collision solids"
  );
});
