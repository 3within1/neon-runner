import { test } from "node:test";
import assert from "node:assert/strict";
import { coinHitBox, shouldCollectCoin } from "../src/physics.js";

test("coinHitBox is a square AABB centered on the pack", () => {
  assert.deepEqual(coinHitBox({ x: 100, y: 50, r: 8 }), {
    x: 92,
    y: 42,
    w: 16,
    h: 16,
  });
});

test("shouldCollectCoin detects overlap with an untaken pack", () => {
  const player = { x: 90, y: 40, w: 28, h: 40 };
  const coin = { x: 100, y: 50, r: 8, taken: false };
  assert.equal(shouldCollectCoin(player, coin), true);
});

test("shouldCollectCoin ignores already-taken packs even on overlap", () => {
  const player = { x: 90, y: 40, w: 28, h: 40 };
  const coin = { x: 100, y: 50, r: 8, taken: true };
  assert.equal(shouldCollectCoin(player, coin), false);
});

test("shouldCollectCoin rejects flush and distant misses", () => {
  const player = { x: 0, y: 0, w: 28, h: 40 };
  // Flush right edge of player vs left edge of coin box (92): no overlap
  assert.equal(
    shouldCollectCoin(player, { x: 28 + 8, y: 20, r: 8, taken: false }),
    false,
    "flush AABB edges do not collect"
  );
  assert.equal(
    shouldCollectCoin(player, { x: 200, y: 200, r: 8, taken: false }),
    false,
    "distant pack"
  );
});
