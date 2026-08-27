import { test } from "node:test";
import assert from "node:assert/strict";
import { stepBossEngage } from "../src/physics.js";

test("stepBossEngage announces online on first Cyber-Rex engage", () => {
  const result = stepBossEngage(true, false, false);
  assert.equal(result.engaged, true);
  assert.equal(result.announceKey, "online");
});

test("stepBossEngage announces sentinelOnline on first miniboss engage", () => {
  const result = stepBossEngage(true, false, true);
  assert.equal(result.engaged, true);
  assert.equal(result.announceKey, "sentinelOnline");
});

test("stepBossEngage does not re-engage when already engaged", () => {
  const result = stepBossEngage(true, true, false);
  assert.equal(result.engaged, true);
  assert.equal(result.announceKey, null);
});

test("stepBossEngage returns null announceKey when not in arena", () => {
  const result = stepBossEngage(false, false, false);
  assert.equal(result.engaged, false);
  assert.equal(result.announceKey, null);
});
