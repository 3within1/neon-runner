import { test } from "node:test";
import assert from "node:assert/strict";
import { ABILITY_STORY, BOSS_STORY, TITLE_STORY } from "../src/story.js";

function assertNonEmptyString(value, label) {
  assert.equal(typeof value, "string", `${label} must be a string`);
  assert.ok(value.trim().length > 0, `${label} must be non-empty`);
}

test("TITLE_STORY keeps brand, tagline, and jack-in CTA", () => {
  assertNonEmptyString(TITLE_STORY.eyebrow, "eyebrow");
  assert.equal(TITLE_STORY.title, "NEON RUNNER");
  assertNonEmptyString(TITLE_STORY.tagline, "tagline");
  assert.equal(TITLE_STORY.button, "JACK IN");
});

test("BOSS_STORY distinguishes Cyber-Rex and Tower Sentinel beats", () => {
  for (const key of [
    "online",
    "armorBreak",
    "overclock",
    "down",
    "exitLocked",
    "sentinelOnline",
    "sentinelDown",
  ]) {
    assertNonEmptyString(BOSS_STORY[key], `BOSS_STORY.${key}`);
  }
  assert.match(BOSS_STORY.online, /CYBER-REX/i);
  assert.match(BOSS_STORY.sentinelOnline, /SENTINEL/i);
  assert.notEqual(BOSS_STORY.down, BOSS_STORY.sentinelDown);
  assert.match(BOSS_STORY.exitLocked, /EXIT LOCKED/i);
});

test("ABILITY_STORY names wall cling, air jump, and dash unlocks", () => {
  assert.match(ABILITY_STORY.wallCling, /WALL CLING/i);
  assert.match(ABILITY_STORY.doubleJump, /AIR JUMP/i);
  assert.match(ABILITY_STORY.dash, /DASH/i);
});
