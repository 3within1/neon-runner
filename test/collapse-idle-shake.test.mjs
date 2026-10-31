import { test } from "node:test";
import assert from "node:assert/strict";
import { tickCollapsePlatform } from "../src/level.js";

/**
 * When a collapse pad is neither armed nor fallen, shake must clear so a
 * leftover telegraph does not keep vibrating after the runner steps off early.
 */
test("tickCollapsePlatform clears shake while idle (unarmed, standing)", () => {
  const p = {
    kind: "collapse",
    fallen: false,
    collapseTimer: 0,
    respawnTimer: 0,
    shake: 1,
  };
  tickCollapsePlatform(p, 1 / 60);
  assert.equal(p.fallen, false);
  assert.equal(p.collapseTimer, 0);
  assert.equal(p.shake, 0, "idle tick extinguishes residual shake");
});
