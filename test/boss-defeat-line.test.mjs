import { test } from "node:test";
import assert from "node:assert/strict";
import { BOSS_STORY, bossDefeatAnnounceLine } from "../src/story.js";

test("bossDefeatAnnounceLine routes Tower Sentinel vs Cyber-Rex", () => {
  assert.equal(bossDefeatAnnounceLine(true), BOSS_STORY.sentinelDown);
  assert.equal(bossDefeatAnnounceLine(false), BOSS_STORY.down);
});
