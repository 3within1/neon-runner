import { test } from "node:test";
import assert from "node:assert/strict";
import {
  considerScoreUnlocks,
  formatClock,
  getActiveSkin,
  getBestClearTime,
  getMeta,
  markCleared,
  recordClearTime,
  recordSectorTime,
  setSkin,
} from "../src/meta.js";

// meta.js falls back to in-memory defaults when localStorage is unavailable
// (as in Node), so these exercise the pure persistence/formatting logic.

test("formatClock renders m:ss.cc", () => {
  assert.equal(formatClock(0), "0:00.00");
  assert.equal(formatClock(75.5), "1:15.50");
  assert.equal(formatClock(-3), "0:00.00", "negative time floors to zero");
});

test("recordSectorTime only improves on a faster time", () => {
  const first = recordSectorTime(0, 30);
  assert.deepEqual(first, { best: 30, improved: true }, "first time is always an improvement");

  const slower = recordSectorTime(0, 45);
  assert.equal(slower.improved, false, "slower run is not an improvement");
  assert.equal(slower.best, 30, "keeps the previous best");

  const faster = recordSectorTime(0, 20);
  assert.deepEqual(faster, { best: 20, improved: true }, "faster run improves the best");
});

test("recordClearTime tracks the fastest full clear", () => {
  assert.equal(getBestClearTime(), null, "no clear recorded yet");
  assert.equal(recordClearTime(120), 120, "first clear sets the best");
  assert.equal(recordClearTime(150), 120, "slower clear is ignored");
  assert.equal(recordClearTime(90), 90, "faster clear wins");
  assert.equal(getBestClearTime(), 90);
});

test("considerScoreUnlocks unlocks the signal skin at 500 DATA", () => {
  considerScoreUnlocks(499);
  assert.equal(getMeta().unlockedSkins.includes("signal"), false, "locked below 500");
  considerScoreUnlocks(500);
  assert.equal(getMeta().unlockedSkins.includes("signal"), true, "unlocked at 500");
});

test("getActiveSkin returns a valid skin definition", () => {
  const skin = getActiveSkin();
  assert.ok(skin && typeof skin.id === "string", "has an id");
  assert.ok(typeof skin.accent === "string", "has an accent color");
});

test("markCleared unlocks ember; lockdown clear also unlocks lockdown skin", () => {
  assert.equal(getMeta().unlockedSkins.includes("ember"), false);
  markCleared(false);
  assert.equal(getMeta().unlockedSkins.includes("ember"), true);
  assert.equal(getMeta().unlockedSkins.includes("lockdown"), false);
  assert.equal(getMeta().hasCleared, true);

  markCleared(true);
  assert.equal(getMeta().lockdownCleared, true);
  assert.equal(getMeta().unlockedSkins.includes("lockdown"), true);
});

test("setSkin refuses skins that are still locked", () => {
  const before = getMeta().skin;
  // Ensure a never-unlocked id is rejected (ember/lockdown may already be unlocked above).
  const lockedId = "not-a-real-skin";
  assert.equal(setSkin(lockedId), before, "unknown/locked skin leaves selection unchanged");
});
