import { test } from "node:test";
import assert from "node:assert/strict";
import { TILE } from "../src/constants.js";
import {
  buildLevel,
  getLevelCount,
  getLivingBoss,
  solidPlatforms,
} from "../src/level.js";
import { level } from "../src/state.js";

test("Cyber-Rex finale boss patrols the grounded arena floor", () => {
  const finale = getLevelCount() - 1;
  buildLevel(finale);
  assert.equal(level.name, "REX CORE");

  const boss = getLivingBoss();
  assert.ok(boss, "finale hosts a living boss");
  assert.equal(boss.type, "rexBoss");
  assert.equal(boss.grounded, true);
  assert.equal(boss.boss, true);
  assert.equal(boss.chase, true);

  assert.ok(boss.minX >= 0, "patrol min stays in-bounds");
  assert.ok(boss.maxX <= level.width, "patrol max stays in-bounds");
  assert.ok(boss.maxX - boss.minX > boss.w, "patrol span fits the boss body");

  const feetY = boss.y + boss.h;
  const midX = boss.x + boss.w * 0.5;
  const floor = solidPlatforms().find(
    (p) =>
      !p.fallen &&
      midX >= p.x &&
      midX <= p.x + p.w &&
      Math.abs(p.y - feetY) < 1
  );
  assert.ok(floor, "boss feet sit on a solid arena pad");
  assert.ok(
    floor.w >= 20 * TILE,
    "Rex Core arena floor stays wide enough for the chase/charge loop"
  );
});
