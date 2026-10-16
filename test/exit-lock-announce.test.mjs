import { test } from "node:test";
import assert from "node:assert/strict";
import { consumeExitLockAnnounce } from "../src/physics.js";

test("consumeExitLockAnnounce fires once per living boss", () => {
  const boss = { lockAnnounced: false };
  assert.equal(consumeExitLockAnnounce(boss), true);
  assert.equal(boss.lockAnnounced, true);
  assert.equal(consumeExitLockAnnounce(boss), false, "second touch stays silent");
});

test("consumeExitLockAnnounce treats undefined lockAnnounced as not yet announced", () => {
  const boss = {};
  assert.equal(consumeExitLockAnnounce(boss), true);
  assert.equal(boss.lockAnnounced, true);
});

test("consumeExitLockAnnounce ignores null or missing boss", () => {
  assert.equal(consumeExitLockAnnounce(null), false);
  assert.equal(consumeExitLockAnnounce(undefined), false);
});
