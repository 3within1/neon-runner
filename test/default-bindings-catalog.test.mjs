import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_BINDINGS } from "../src/meta.js";

const REQUIRED = ["left", "right", "jump", "dash", "pause", "mute"];

test("DEFAULT_BINDINGS exposes exactly the six gameplay/meta actions", () => {
  assert.deepEqual(Object.keys(DEFAULT_BINDINGS).sort(), [...REQUIRED].sort());
});

test("DEFAULT_BINDINGS maps each action to a distinct non-empty code", () => {
  for (const action of REQUIRED) {
    const code = DEFAULT_BINDINGS[action];
    assert.equal(typeof code, "string", `${action} code type`);
    assert.ok(code.length > 0, `${action} must not start unbound`);
  }
  const codes = REQUIRED.map((action) => DEFAULT_BINDINGS[action]);
  assert.equal(new Set(codes).size, codes.length, "default codes must be pairwise distinct");
});
