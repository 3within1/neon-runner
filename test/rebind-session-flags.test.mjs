import { test } from "node:test";
import assert from "node:assert/strict";
import { cancelRebind, isRebinding, startRebind } from "../src/input.js";

test("startRebind / cancelRebind toggle the listening session flag", () => {
  cancelRebind();
  assert.equal(isRebinding(), false);

  startRebind("jump");
  assert.equal(isRebinding(), true);

  cancelRebind();
  assert.equal(isRebinding(), false);
});
