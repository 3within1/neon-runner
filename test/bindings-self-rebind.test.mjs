import { test } from "node:test";
import assert from "node:assert/strict";
import { bindingsWithExclusiveCode } from "../src/input.js";
import { DEFAULT_BINDINGS } from "../src/meta.js";

/**
 * Rebinding an action to the code it already owns must not clear itself (the
 * exclusive loop skips the target action). A regression here would blank the
 * binding mid-settings flow.
 */
test("bindingsWithExclusiveCode keeps the action when reassigned its own code", () => {
  const current = { ...DEFAULT_BINDINGS };
  const next = bindingsWithExclusiveCode(current, "jump", current.jump);
  assert.equal(next.jump, DEFAULT_BINDINGS.jump);
  assert.equal(next.dash, DEFAULT_BINDINGS.dash);
  assert.equal(next.left, DEFAULT_BINDINGS.left);
  assert.deepEqual(next, current);
});
