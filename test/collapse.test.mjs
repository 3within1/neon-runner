import { test } from "node:test";
import assert from "node:assert/strict";
import { armCollapsePlatform, tickCollapsePlatform } from "../src/level.js";

function collapsePad(overrides = {}) {
  return {
    kind: "collapse",
    fallen: false,
    collapseTimer: 0,
    respawnTimer: 0,
    shake: 0,
    ...overrides,
  };
}

test("armCollapsePlatform starts the 0.45s fall fuse once", () => {
  const p = collapsePad();
  assert.equal(armCollapsePlatform(p), true);
  assert.equal(p.collapseTimer, 0.45);
  armCollapsePlatform(p);
  assert.equal(p.collapseTimer, 0.45, "does not reset an already-armed fuse");
});

test("armCollapsePlatform ignores solid or already-fallen pads", () => {
  const solid = { kind: "solid", fallen: false, collapseTimer: 0 };
  assert.equal(armCollapsePlatform(solid), false);
  assert.equal(solid.collapseTimer, 0);

  const fallen = collapsePad({ fallen: true, collapseTimer: 0 });
  assert.equal(armCollapsePlatform(fallen), false);
  assert.equal(fallen.collapseTimer, 0);
});

test("tickCollapsePlatform falls after the fuse then respawns", () => {
  const p = collapsePad({ collapseTimer: 0.45 });
  tickCollapsePlatform(p, 0.2);
  assert.equal(p.fallen, false);
  assert.equal(p.shake, 1);
  assert.ok(p.collapseTimer > 0 && p.collapseTimer < 0.45);

  tickCollapsePlatform(p, 0.3);
  assert.equal(p.fallen, true, "platform drops when fuse expires");
  assert.equal(p.respawnTimer, 2.4);
  assert.equal(p.shake, 0);

  tickCollapsePlatform(p, 2.4);
  assert.equal(p.fallen, false, "platform returns after respawn timer");
  assert.equal(p.collapseTimer, 0);
  assert.equal(p.shake, 0);
});

test("tickCollapsePlatform leaves non-collapse platforms untouched", () => {
  const solid = { kind: "solid", fallen: false, collapseTimer: 1, shake: 0 };
  tickCollapsePlatform(solid, 1);
  assert.equal(solid.collapseTimer, 1);
  assert.equal(solid.fallen, false);
});
