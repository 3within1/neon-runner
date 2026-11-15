import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyBindings,
  bindingsWithExclusiveCode,
  clearInput,
  getBindings,
} from "../src/input.js";
import { DEFAULT_BINDINGS } from "../src/meta.js";

test("applyBindings restores omitted actions after an exclusive rebind clears one", () => {
  clearInput();
  // Steal Space from jump onto dash — jump becomes "" in the working map.
  const exclusive = bindingsWithExclusiveCode({ ...DEFAULT_BINDINGS }, "dash", "Space");
  assert.equal(exclusive.jump, "");
  assert.equal(exclusive.dash, "Space");

  // Partial apply merges over DEFAULT_BINDINGS, so jump comes back to Space
  // even though the exclusive map left it empty.
  applyBindings({ pause: "KeyP", dash: "Space" });
  const bound = getBindings();
  assert.equal(bound.pause, "KeyP");
  assert.equal(bound.dash, "Space");
  assert.equal(bound.jump, DEFAULT_BINDINGS.jump, "omitted jump restores default Space");
  assert.equal(bound.left, DEFAULT_BINDINGS.left);
  assert.equal(bound.mute, DEFAULT_BINDINGS.mute);
});

test("applyBindings replaces a prior full custom map with defaults for omitted keys", () => {
  clearInput();
  applyBindings({
    left: "KeyA",
    right: "KeyD",
    jump: "KeyW",
    dash: "KeyK",
    pause: "KeyP",
    mute: "KeyU",
  });

  applyBindings({ jump: "KeyJ" });
  const bound = getBindings();
  assert.equal(bound.jump, "KeyJ");
  assert.equal(bound.left, DEFAULT_BINDINGS.left, "unmentioned left snaps back to default");
  assert.equal(bound.right, DEFAULT_BINDINGS.right);
  assert.equal(bound.dash, DEFAULT_BINDINGS.dash);
  assert.equal(bound.pause, DEFAULT_BINDINGS.pause);
  assert.equal(bound.mute, DEFAULT_BINDINGS.mute);
});
