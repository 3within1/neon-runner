import { test } from "node:test";
import assert from "node:assert/strict";
import { cancelRebind, isRebinding, startRebind } from "../src/input.js";

// Settings listen-mode must enter and exit cleanly. A stuck listeningAction
// swallows gameplay keys until the player reloads.

test("startRebind arms listen mode and cancelRebind clears it", () => {
  cancelRebind();
  assert.equal(isRebinding(), false);

  startRebind("jump");
  assert.equal(isRebinding(), true);

  cancelRebind();
  assert.equal(isRebinding(), false);
});

test("a second startRebind keeps listen mode armed for the new action", () => {
  cancelRebind();
  startRebind("dash");
  assert.equal(isRebinding(), true);

  startRebind("pause");
  assert.equal(isRebinding(), true, "switching actions must not drop listen mode");

  cancelRebind();
  assert.equal(isRebinding(), false);
});
