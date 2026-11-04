import { test } from "node:test";
import assert from "node:assert/strict";
import { floorYUnderEntity } from "../src/level.js";

/**
 * When several solids share a column inside the feet band, the helper must
 * pick the uppermost top (smallest Y). Picking a lower pad would snap the
 * runner through a ledge into the floor below.
 */
test("floorYUnderEntity prefers the uppermost solid when pads are stacked", () => {
  const platforms = [
    { x: 0, y: 240, w: 120, h: 24 },
    { x: 0, y: 180, w: 120, h: 24 },
    { x: 0, y: 210, w: 120, h: 24 },
  ];
  const e = { x: 40, y: 140, w: 28, h: 40 }; // feet near 180
  assert.equal(floorYUnderEntity(platforms, e, 58), 180);

  // Order of the list must not matter.
  const reversed = [...platforms].reverse();
  assert.equal(floorYUnderEntity(reversed, e, 58), 180);
});
