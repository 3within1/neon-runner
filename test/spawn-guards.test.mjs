import { test } from "node:test";
import assert from "node:assert/strict";
import { LEVELS, buildLevel } from "../src/level.js";

/**
 * spawnEnemy throws on unknown types and patrol spans narrower than the body.
 * Those guards catch LEVELS typos before they ship as soft-locks / NaN physics.
 * Mutate LEVELS ephemerally — Node isolates this file from other test files.
 */

function pushTempLevel(overrides) {
  const base = {
    id: "spawn-guard-temp",
    sector: "9999",
    name: "SPAWN GUARD",
    width: 20,
    height: 12,
    spawn: [2, 8],
    exit: [16, 8],
    // Exit at ty=8 → feet at 10*TILE, flush with the main floor top.
    platforms: [[0, 10, 20, 2]],
    hazards: [],
    checkpoints: [[8, 9]],
    coins: [],
    enemies: [],
    ...overrides,
  };
  LEVELS.push(base);
  return LEVELS.length - 1;
}

function popTempLevel() {
  LEVELS.pop();
}

test("buildLevel throws on an unknown enemy type", () => {
  const index = pushTempLevel({
    enemies: [[5, 9, 4, 10, "not-a-real-foe"]],
  });
  try {
    assert.throws(
      () => buildLevel(index),
      /Unknown enemy type "not-a-real-foe"/
    );
  } finally {
    popTempLevel();
  }
});

test("buildLevel throws when an X patrol is narrower than the enemy body", () => {
  // drone w=36px → 0.75 tiles; span 0.5 tiles is too narrow.
  const index = pushTempLevel({
    enemies: [[5, 9, 5, 5.5, "drone"]],
  });
  try {
    assert.throws(() => buildLevel(index), /Enemy patrol too narrow/);
  } finally {
    popTempLevel();
  }
});
