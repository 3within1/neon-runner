import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyBindings,
  bindingsWithExclusiveCode,
  getBindings,
} from "../src/input.js";
import { DEFAULT_BINDINGS } from "../src/meta.js";

// Rebinding an action onto another action's code empties the loser. That empty
// string must stick through applyBindings (defaults spread first, then patch),
// otherwise exclusive rebind would silently restore two actions on one key.

test("exclusive rebind empties the displaced action and applyBindings keeps it empty", () => {
  const next = bindingsWithExclusiveCode({ ...DEFAULT_BINDINGS }, "dash", DEFAULT_BINDINGS.jump);
  assert.equal(next.dash, DEFAULT_BINDINGS.jump);
  assert.equal(next.jump, "", "jump vacated so Space is exclusive to dash");

  applyBindings(next);
  const bound = getBindings();
  assert.equal(bound.dash, DEFAULT_BINDINGS.jump);
  assert.equal(bound.jump, "", "empty jump is not restored to the default Space");

  // Restore defaults so later input tests in this process stay usable.
  applyBindings({ ...DEFAULT_BINDINGS });
  assert.equal(getBindings().jump, DEFAULT_BINDINGS.jump);
});
