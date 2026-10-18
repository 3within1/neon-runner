import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import { buildLevel } from "../src/level.js";
import { level } from "../src/state.js";

/**
 * Regression for the Blackout vault-door climb (#6): the exit must sit above
 * the main floor with mid ledges in the endgame column, not flush on the
 * runway (which stranded runners under a locked high door).
 */
test("Blackout Run exit is elevated with climb ledges near the vault door", () => {
  buildLevel(5);
  assert.equal(level.name, "BLACKOUT RUN");

  const floors = level.platforms.filter((p) => p.h >= 2 * TILE && p.w > TILE);
  assert.ok(floors.length >= 1, "expected a main floor runway");
  const floorY = Math.max(...floors.map((p) => p.y));
  const exitFeet = level.exit.y + level.exit.h;

  assert.ok(
    exitFeet <= floorY - TILE,
    `exit feet (${exitFeet}) must sit at least one tile above floor (${floorY})`
  );

  const doorColumn = level.width * 0.75;
  const climbLedges = level.platforms.filter(
    (p) =>
      !p.fallen &&
      p.kind !== "collapse" &&
      p.y < floorY &&
      p.y + p.h >= exitFeet - TILE &&
      p.x + p.w > doorColumn
  );
  assert.ok(
    climbLedges.length >= 2,
    "expected stepped climb pads in the vault-door column"
  );
});
