import { test } from "node:test";
import assert from "node:assert/strict";
import { bindingsWithExclusiveCode, getBindings, applyBindings, clearInput } from "../src/input.js";
import { DEFAULT_BINDINGS } from "../src/meta.js";

test("bindingsWithExclusiveCode clears the previous owner of a code", () => {
  const current = { ...DEFAULT_BINDINGS };
  const next = bindingsWithExclusiveCode(current, "dash", "Space");
  assert.equal(next.dash, "Space");
  assert.equal(next.jump, "", "jump no longer shares Space");
  assert.equal(next.left, DEFAULT_BINDINGS.left);
});

test("bindingsWithExclusiveCode is a no-op conflict when code was unused", () => {
  const current = { ...DEFAULT_BINDINGS };
  const next = bindingsWithExclusiveCode(current, "jump", "KeyJ");
  assert.equal(next.jump, "KeyJ");
  assert.equal(next.dash, DEFAULT_BINDINGS.dash);
  assert.equal(next.pause, DEFAULT_BINDINGS.pause);
});

test("applyBindings merges over defaults and is readable via getBindings", () => {
  clearInput();
  applyBindings({ jump: "KeyJ" });
  const bound = getBindings();
  assert.equal(bound.jump, "KeyJ");
  assert.equal(bound.left, DEFAULT_BINDINGS.left, "unmentioned actions keep defaults");
});
