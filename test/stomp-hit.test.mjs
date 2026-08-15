import { test } from "node:test";
import assert from "node:assert/strict";
import { STOMP_SLACK } from "../src/constants.js";
import { isStompHit } from "../src/level.js";

test("isStompHit requires downward velocity and top-side entry", () => {
  const bodyY = 100;
  assert.equal(isStompHit(200, bodyY - 2, bodyY, bodyY + 4), true);
  assert.equal(isStompHit(0, bodyY - 2, bodyY, bodyY + 4), false, "not falling");
  assert.equal(isStompHit(-100, bodyY - 2, bodyY, bodyY + 4), false, "rising");
});

test("isStompHit allows STOMP_SLACK penetration from the previous frame", () => {
  const bodyY = 100;
  assert.equal(isStompHit(200, bodyY + STOMP_SLACK, bodyY, bodyY + 10), true);
  assert.equal(
    isStompHit(200, bodyY + STOMP_SLACK + 1, bodyY, bodyY + 10),
    false,
    "prev bottom past slack is a side/bottom hit"
  );
});

test("isStompHit requires current feet at or below the body top", () => {
  const bodyY = 100;
  assert.equal(isStompHit(200, bodyY - 4, bodyY, bodyY - 1), false);
  assert.equal(isStompHit(200, bodyY - 4, bodyY, bodyY), true);
});
