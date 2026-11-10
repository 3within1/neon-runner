import { test } from "node:test";
import assert from "node:assert/strict";
import { STOMP_SLACK } from "../src/constants.js";
import { isStompHit } from "../src/level.js";

/**
 * Combat callers can tighten or loosen the previous-frame penetration window.
 * Custom slack must be exclusive at the edge the same way the default is.
 */
test("isStompHit honors a custom slack override at the exclusive edge", () => {
  const bodyY = 100;
  const slack = 2;
  assert.ok(slack < STOMP_SLACK, "fixture uses a tighter window than default");

  assert.equal(isStompHit(200, bodyY + slack, bodyY, bodyY + 8, slack), true);
  assert.equal(
    isStompHit(200, bodyY + slack + 1, bodyY, bodyY + 8, slack),
    false,
    "prev bottom past custom slack is not a stomp"
  );
  // Default slack would still accept the +1 case.
  assert.equal(isStompHit(200, bodyY + slack + 1, bodyY, bodyY + 8), true);
});

test("isStompHit with zero slack requires prev bottom at or above the body top", () => {
  const bodyY = 100;
  assert.equal(isStompHit(200, bodyY, bodyY, bodyY + 4, 0), true);
  assert.equal(isStompHit(200, bodyY + 1, bodyY, bodyY + 4, 0), false);
});
