import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import { buildLevel, getLevelCount } from "../src/level.js";
import { isExitStandingOnPlatform } from "../src/physics.js";
import { level } from "../src/state.js";

test("isExitStandingOnPlatform requires feet on a solid pad", () => {
  const exit = { x: 100, y: 200, w: TILE * 1.2, h: TILE * 2 };
  const pad = { x: 90, y: exit.y + exit.h, w: 80, h: TILE };
  assert.equal(isExitStandingOnPlatform(exit, [pad]), true);
  assert.equal(
    isExitStandingOnPlatform(exit, [{ ...pad, fallen: true }]),
    false,
    "fallen pads do not count"
  );
  assert.equal(
    isExitStandingOnPlatform(exit, [{ ...pad, y: pad.y + 4 }]),
    false,
    "feet must sit on the pad top"
  );
  assert.equal(
    isExitStandingOnPlatform(exit, [{ ...pad, x: exit.x + exit.w + 1 }]),
    false,
    "pad must overlap exit in X"
  );
});

test("every campaign exit stands on a platform top after build", () => {
  const n = getLevelCount();
  for (let i = 0; i < n; i++) {
    buildLevel(i);
    assert.equal(
      isExitStandingOnPlatform(level.exit, level.platforms),
      true,
      `sector ${i} (${level.name}) exit must be grounded`
    );
  }
});
