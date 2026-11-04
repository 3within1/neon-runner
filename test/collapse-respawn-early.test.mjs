import { test } from "node:test";
import assert from "node:assert/strict";
import { tickCollapsePlatform } from "../src/level.js";

/**
 * A fallen collapse pad must stay gone until its full respawn timer elapses.
 * Early ticks that only partially drain respawnTimer must not revive it mid-gap.
 */
test("tickCollapsePlatform keeps a fallen pad down until respawn fully elapses", () => {
  const p = {
    kind: "collapse",
    fallen: true,
    collapseTimer: 0,
    respawnTimer: 2.4,
    shake: 0,
  };

  tickCollapsePlatform(p, 1.0);
  assert.equal(p.fallen, true, "still fallen after a partial respawn tick");
  assert.ok(p.respawnTimer > 0 && p.respawnTimer < 2.4);

  tickCollapsePlatform(p, 1.0);
  assert.equal(p.fallen, true, "still fallen with time remaining");
  assert.ok(p.respawnTimer > 0);

  tickCollapsePlatform(p, p.respawnTimer);
  assert.equal(p.fallen, false, "revives exactly when the leftover timer hits zero");
  assert.equal(p.collapseTimer, 0);
  assert.equal(p.shake, 0);
});
