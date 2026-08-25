import { test } from "node:test";
import assert from "node:assert/strict";
import { isFeetOnPlatformTop, rect } from "../src/physics.js";

const pad = rect(40, 212, 80, 16);

test("isFeetOnPlatformTop is true when feet sit on the platform top", () => {
  const entity = rect(50, 172, 36, 40); // feet at y=212
  assert.equal(isFeetOnPlatformTop(entity, pad), true);
});

test("isFeetOnPlatformTop rejects feet entirely left or right of the pad", () => {
  assert.equal(isFeetOnPlatformTop(rect(120, 172, 36, 40), pad), false, "left of pad");
  assert.equal(isFeetOnPlatformTop(rect(0, 172, 36, 40), pad), false, "right of pad");
});

test("isFeetOnPlatformTop uses a strict <tol vertical window (default 3)", () => {
  const near = rect(50, 172 + 2.9, 36, 40); // feet at pad.y + 2.9
  const edge = rect(50, 172 + 3, 36, 40); // feet at pad.y + 3
  assert.equal(isFeetOnPlatformTop(near, pad), true);
  assert.equal(isFeetOnPlatformTop(edge, pad), false, "tol is exclusive at 3px");
});

test("isFeetOnPlatformTop accepts a 1px horizontal overlap and rejects flush edges", () => {
  const leftLip = rect(39, 172, 36, 40);
  const flushRight = rect(4, 172, 36, 40); // entity.x + w === pad.x
  const onePx = rect(5, 172, 36, 40);
  assert.equal(isFeetOnPlatformTop(leftLip, pad), true);
  assert.equal(isFeetOnPlatformTop(flushRight, pad), false, "flush right edge misses");
  assert.equal(isFeetOnPlatformTop(onePx, pad), true, "1px overlap counts");
});
