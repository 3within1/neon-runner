import { test } from "node:test";
import assert from "node:assert/strict";
import { STOMP_SLACK } from "../src/constants.js";
import { enemyContactOutcome } from "../src/level.js";

function playerBox(overrides = {}) {
  return {
    x: 100,
    y: 80,
    w: 28,
    h: 40,
    prevY: 70,
    vy: 200,
    ...overrides,
  };
}

function bodyBox(overrides = {}) {
  return { x: 100, y: 120, w: 36, h: 36, ...overrides };
}

test("enemyContactOutcome returns null when AABBs do not overlap", () => {
  const player = playerBox({ x: 0 });
  const body = bodyBox({ x: 200 });
  assert.equal(enemyContactOutcome(player, body), null);
});

test("enemyContactOutcome returns stomp for a top-side falling entry", () => {
  const body = bodyBox({ y: 120 });
  const player = playerBox({
    y: 100, // bottom 140 >= body.y
    prevY: 80, // prevBottom 120 <= body.y + slack
    vy: 200,
  });
  assert.equal(enemyContactOutcome(player, body), "stomp");
});

test("enemyContactOutcome returns hurt for side contact while falling past slack", () => {
  const body = bodyBox({ y: 100 });
  const player = playerBox({
    y: 100,
    prevY: 100 + STOMP_SLACK + 1 - 40, // prevBottom past slack
    vy: 200,
  });
  assert.equal(enemyContactOutcome(player, body), "hurt");
});

test("enemyContactOutcome returns hurt when rising through the body", () => {
  const body = bodyBox({ y: 100 });
  const player = playerBox({
    y: 90,
    prevY: 110,
    vy: -100,
  });
  assert.equal(enemyContactOutcome(player, body), "hurt");
});

test("enemyContactOutcome never returns hurt for a valid stomp fixture", () => {
  const body = bodyBox({ y: 100 });
  const player = playerBox({
    y: body.y - 10,
    prevY: body.y - 12 - 40,
    vy: 180,
  });
  // prevBottom = body.y - 12 <= body.y + slack; bottom = body.y + 30 >= body.y
  assert.equal(enemyContactOutcome(player, body), "stomp");
  assert.notEqual(enemyContactOutcome(player, body), "hurt");
});
