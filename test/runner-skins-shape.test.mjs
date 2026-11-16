import { test } from "node:test";
import assert from "node:assert/strict";
import { RUNNER_SKINS } from "../src/meta.js";

test("every runner skin exposes id, name, and palette fields", () => {
  const ids = Object.keys(RUNNER_SKINS);
  assert.ok(ids.includes("default"));
  assert.ok(ids.includes("signal"));
  assert.ok(ids.includes("ember"));
  assert.ok(ids.includes("lockdown"));

  for (const id of ids) {
    const skin = RUNNER_SKINS[id];
    assert.equal(skin.id, id);
    assert.equal(typeof skin.name, "string");
    assert.ok(skin.name.length > 0);
    for (const key of ["body", "accent", "trim", "core"]) {
      assert.match(skin[key], /^#[0-9a-fA-F]{6}$/, `${id}.${key} is a hex color`);
    }
  }
});
