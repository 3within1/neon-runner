import { test } from "node:test";
import assert from "node:assert/strict";
import { applyBindings, getBindings, clearInput } from "../src/input.js";
import { DEFAULT_BINDINGS } from "../src/meta.js";

// Settings UI mutates the object returned by getBindings. A shared reference
 // would corrupt live input mid-frame / mid-rebind.

test("getBindings returns a shallow copy, not the live bindings object", () => {
  clearInput();
  applyBindings({ ...DEFAULT_BINDINGS });
  const a = getBindings();
  const b = getBindings();
  assert.notEqual(a, b, "each call allocates a fresh object");
  a.jump = "KeyZ";
  assert.equal(getBindings().jump, DEFAULT_BINDINGS.jump, "mutating the copy is a no-op");
});
