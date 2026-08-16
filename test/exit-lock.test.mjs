import { test } from "node:test";
import assert from "node:assert/strict";
import { pushBackFromLockedExit } from "../src/level.js";

test("pushBackFromLockedExit parks the player left of the exit", () => {
  const player = { x: 500, w: 36, vx: 200 };
  const exit = { x: 480 };
  pushBackFromLockedExit(player, exit);
  assert.equal(player.x, 480 - 36 - 2);
  assert.equal(player.vx, -120);
});

test("pushBackFromLockedExit does not flip leftward velocity", () => {
  const player = { x: 400, w: 36, vx: -50 };
  const exit = { x: 480 };
  pushBackFromLockedExit(player, exit);
  assert.equal(player.x, 400, "already clear of the exit");
  assert.equal(player.vx, -50);
});
