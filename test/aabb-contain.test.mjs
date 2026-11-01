import { test } from "node:test";
import assert from "node:assert/strict";
import { aabb, rect } from "../src/physics.js";

// Containment is the common case for stomps (player box inside enemy) and
// exit/jack-in overlap. Edge-touch stays non-overlapping (see physics.test).

test("aabb treats identical boxes as overlapping", () => {
  const box = rect(10, 20, 28, 40);
  assert.equal(aabb(box, rect(10, 20, 28, 40)), true);
});

test("aabb detects full containment in either direction", () => {
  const outer = rect(0, 0, 100, 100);
  const inner = rect(25, 25, 20, 20);
  assert.equal(aabb(outer, inner), true, "outer vs inner");
  assert.equal(aabb(inner, outer), true, "inner vs outer (stomp/exit probes)");
  assert.equal(aabb(inner, rect(200, 200, 10, 10)), false);
});

test("aabb corner-touch alone is not an overlap", () => {
  const a = rect(0, 0, 10, 10);
  assert.equal(aabb(a, rect(10, 10, 10, 10)), false);
  assert.equal(aabb(a, rect(9, 9, 10, 10)), true, "1px corner nest still overlaps");
});
