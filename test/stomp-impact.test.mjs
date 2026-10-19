import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveStompImpact } from "../src/physics.js";

test("resolveStompImpact kill juice: boss > armored > normal", () => {
  assert.deepEqual(resolveStompImpact({ boss: true, killed: true }), {
    shake: 0.45,
    hitStop: 0.14,
  });
  assert.deepEqual(resolveStompImpact({ armored: true, killed: true }), {
    shake: 0.15,
    hitStop: 0.1,
  });
  assert.deepEqual(resolveStompImpact({ killed: true }), {
    shake: 0.15,
    hitStop: 0.05,
  });
});

test("resolveStompImpact chip juice: boss > armored > normal", () => {
  assert.deepEqual(resolveStompImpact({ boss: true, killed: false }), {
    shake: 0.16,
    hitStop: 0.1,
  });
  assert.deepEqual(resolveStompImpact({ armored: true, killed: false }), {
    shake: 0.08,
    hitStop: 0.08,
  });
  assert.deepEqual(resolveStompImpact({ killed: false }), {
    shake: 0.08,
    hitStop: 0.04,
  });
});

test("boss flag wins over armored on kill hit-stop", () => {
  assert.deepEqual(
    resolveStompImpact({ boss: true, armored: true, killed: true }),
    { shake: 0.45, hitStop: 0.14 }
  );
});
