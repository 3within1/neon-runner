import { test } from "node:test";
import assert from "node:assert/strict";
import { tickCollapsePlatform } from "../src/level.js";

test("tickCollapsePlatform recovers when a hitch overshoots the respawn timer", () => {
  const p = {
    kind: "collapse",
    fallen: true,
    collapseTimer: 0,
    respawnTimer: 0.5,
    shake: 1,
  };

  tickCollapsePlatform(p, 2.0);
  assert.equal(p.fallen, false, "large dt still restores the pad");
  assert.equal(p.collapseTimer, 0, "fuse stays disarmed after respawn");
  assert.equal(p.shake, 0, "shake clears on restore");
  assert.ok(p.respawnTimer <= 0, "respawn timer may overshoot below zero");

  tickCollapsePlatform(p, 0.016);
  assert.equal(p.fallen, false, "solid pad does not re-fall without re-arming");
  assert.equal(p.collapseTimer, 0);
  assert.equal(p.shake, 0);
});
